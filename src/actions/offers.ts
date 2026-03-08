"use server";

import { createClient } from "@/lib/supabase/server";
import { BID_LIMITS, BID_LIMIT_PERIOD_DAYS } from "@/lib/constants";
import { sendNewOfferAlert, sendOfferAccepted } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { subDays } from "date-fns";

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
