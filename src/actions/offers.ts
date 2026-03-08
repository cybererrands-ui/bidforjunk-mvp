"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BID_LIMITS,
  BID_LIMIT_PERIOD_DAYS,
  MAX_NEGOTIATION_TURNS,
  OFFER_EXPIRY_HOURS,
} from "@/lib/constants";
import { sendNewOfferAlert, sendOfferAccepted } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

function getExpiresAt(): string {
  return new Date(
    Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();
}

export async function checkBidLimit(providerId: string, isSubscribed: boolean) {
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", providerId)
    .single();

  if (!provider) throw new Error("Provider not found");

  const limit = isSubscribed
    ? BID_LIMITS.subscribed
    : provider.is_verified
      ? BID_LIMITS.verified_free
      : BID_LIMITS.unverified;

  if (limit === Infinity) return { canBid: true, remaining: Infinity };

  const sevenDaysAgo = subDays(new Date(), BID_LIMIT_PERIOD_DAYS);

  const { count } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("kind", "bid")
    .gt("created_at", sevenDaysAgo.toISOString());

  const bidsUsed = count || 0;
  const remaining = Math.max(0, limit - bidsUsed);

  return { canBid: remaining > 0, remaining, limit };
}

export async function submitOffer(
  jobId: string,
  providerId: string,
  priceCents: number,
  notes?: string
) {
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("profiles")
    .select("subscription_active, display_name")
    .eq("id", providerId)
    .single();

  if (!provider) throw new Error("Provider not found");

  const bidCheck = await checkBidLimit(providerId, provider.subscription_active);
  if (!bidCheck.canBid) {
    throw new Error("Bid limit exceeded for this period");
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("customer_id, title, location_city")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("Job not found");

  const { data: customer } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", job.customer_id)
    .single();

  if (!customer) throw new Error("Customer not found");

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      job_id: jobId,
      provider_id: providerId,
      customer_id: job.customer_id,
      kind: "bid",
      status: "active",
      price_cents: priceCents,
      notes: notes || null,
      turn_number: 1,
      expires_at: getExpiresAt(),
    })
    .select()
    .single();

  if (error) throw error;

  try {
    await sendNewOfferAlert(customer.email, provider.display_name, job.title, priceCents);
  } catch {
    // Continue even if email fails
  }

  await supabase.from("notifications").insert({
    user_id: job.customer_id,
    type: "newOfferAlert",
    title: "New Offer",
    message: `${provider.display_name} submitted an offer for ${job.title}`,
    related_job_id: jobId,
    related_offer_id: offer!.id,
  });

  const { data: jobStatus } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  if (jobStatus?.status === "open") {
    await supabase.from("jobs").update({ status: "negotiating" }).eq("id", jobId);
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath("/provider/jobs");
  return offer;
}

export async function submitCounterOffer(
  jobId: string,
  senderId: string,
  priceCents: number,
  notes?: string
) {
  const supabase = await createClient();

  // Determine the sender's role context for this job
  const { data: job } = await supabase
    .from("jobs")
    .select("customer_id, title")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("Job not found");

  const isCustomer = senderId === job.customer_id;

  // Count existing turns by this sender (as counter-offers) to enforce MAX_NEGOTIATION_TURNS
  const { count: turnCount } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("kind", "counter")
    .eq(isCustomer ? "customer_id" : "provider_id", senderId);

  const currentTurns = turnCount || 0;

  if (currentTurns >= MAX_NEGOTIATION_TURNS) {
    throw new Error(
      `Maximum counter-offers reached (${MAX_NEGOTIATION_TURNS}). Please accept an existing offer or start fresh.`
    );
  }

  // Expire any currently active offers for this job from the opposite side
  await supabase
    .from("offers")
    .update({ status: "expired" })
    .eq("job_id", jobId)
    .eq("status", "active");

  // Determine provider_id and customer_id for the counter-offer
  let providerId: string;
  let customerId: string;

  if (isCustomer) {
    customerId = senderId;
    // Find the provider from the most recent offer on this job
    const { data: lastOffer } = await supabase
      .from("offers")
      .select("provider_id")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastOffer) throw new Error("No existing offers to counter");
    providerId = lastOffer.provider_id;
  } else {
    providerId = senderId;
    customerId = job.customer_id;
  }

  const newTurnNumber = currentTurns + 1;

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      job_id: jobId,
      provider_id: providerId,
      customer_id: customerId,
      kind: "counter",
      status: "active",
      price_cents: priceCents,
      notes: notes || null,
      turn_number: newTurnNumber,
      expires_at: getExpiresAt(),
    })
    .select()
    .single();

  if (error) throw error;

  // Notify the other party
  const recipientId = isCustomer ? providerId : customerId;
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", senderId)
    .single();

  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "newOfferAlert",
    title: "Counter-Offer Received",
    message: `${senderProfile?.display_name || "Someone"} sent a counter-offer for ${job.title}`,
    related_job_id: jobId,
    related_offer_id: offer!.id,
  });

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  return offer;
}

export async function expireOffer(offerId: string) {
  const supabase = await createClient();

  const { data: offer, error: fetchError } = await supabase
    .from("offers")
    .select("id, job_id, status")
    .eq("id", offerId)
    .single();

  if (fetchError || !offer) throw new Error("Offer not found");

  if (offer.status !== "active") {
    throw new Error("Only active offers can be expired");
  }

  const { error } = await supabase
    .from("offers")
    .update({ status: "expired" })
    .eq("id", offerId);

  if (error) throw error;

  revalidatePath(`/customer/jobs/${offer.job_id}`);
  revalidatePath(`/provider/jobs/${offer.job_id}`);
  return { offerId, status: "expired" };
}

export async function acceptOffer(offerId: string) {
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (!offer) throw new Error("Offer not found");

  await supabase
    .from("offers")
    .update({ status: "accepted", kind: "accept" })
    .eq("id", offerId);

  await supabase
    .from("jobs")
    .update({
      status: "locked",
      agreed_price_cents: offer.price_cents,
      final_offer_id: offerId,
    })
    .eq("id", offer.job_id);

  await supabase
    .from("offers")
    .update({ status: "rejected" })
    .eq("job_id", offer.job_id)
    .neq("id", offerId);

  const { data: provider } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", offer.provider_id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", offer.job_id)
    .single();

  if (provider && job) {
    try {
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", offer.customer_id)
        .single();

      if (customerProfile) {
        await sendOfferAccepted(
          provider.email,
          customerProfile.display_name,
          job.title,
          offer.price_cents
        );
      }
    } catch {
      // Continue even if email fails
    }

    await supabase.from("notifications").insert({
      user_id: offer.provider_id,
      type: "offerAccepted",
      title: "Offer Accepted",
      message: `Your offer for ${job.title} has been accepted`,
      related_job_id: offer.job_id,
    });
  }

  revalidatePath(`/customer/jobs/${offer.job_id}`);
  revalidatePath(`/provider/jobs/${offer.job_id}`);
  return { offerId, jobId: offer.job_id };
}
