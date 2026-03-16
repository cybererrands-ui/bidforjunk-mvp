"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BID_LIMITS,
  BID_LIMIT_PERIOD_DAYS,
  MAX_NEGOTIATION_TURNS,
  OFFER_EXPIRY_HOURS,
  SUBSCRIPTION_TIERS,
  getQuoteCap,
  type SubscriptionTier,
} from "@/lib/constants";
// TODO: Re-enable when admin verification UI is built
// import { checkProviderVisibility } from "@/lib/provider-visibility";
import { sendNewOfferAlert, sendServiceAgreement } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { subDays, subMonths } from "date-fns";

function getExpiresAt(): string {
  return new Date(
    Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();
}

export async function checkBidLimit(providerId: string, isSubscribed: boolean) {
  const supabase = await createClient();
  await supabase.auth.getUser(); // Force session validation for RLS

  const { data: provider } = await supabase
    .from("profiles")
    .select("is_verified, subscription_tier, monthly_quotes_used, monthly_quotes_reset_at")
    .eq("id", providerId)
    .single();

  if (!provider) throw new Error("Provider not found");

  const tier = (provider.subscription_tier || "free") as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const limit = getQuoteCap(tier, provider.is_verified);

  if (limit === Infinity) return { canBid: true, remaining: Infinity };

  // For paid tiers, use monthly tracking; for free tier, use weekly count
  if (tier !== "free" && tierConfig.period === "month") {
    // Monthly tracking via monthly_quotes_used field
    const bidsUsed = provider.monthly_quotes_used || 0;
    const remaining = Math.max(0, limit - bidsUsed);
    return { canBid: remaining > 0, remaining, limit, period: "month" };
  }

  // Free tier: weekly rolling window
  const sevenDaysAgo = subDays(new Date(), BID_LIMIT_PERIOD_DAYS);

  const { count } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("kind", "bid")
    .gt("created_at", sevenDaysAgo.toISOString());

  const bidsUsed = count || 0;
  const remaining = Math.max(0, limit - bidsUsed);

  return { canBid: remaining > 0, remaining, limit, period: "week" };
}

export async function submitOffer(
  jobId: string,
  providerId: string,
  priceCents: number,
  notes?: string
) {
  const supabase = await createClient();

  // Force session refresh so auth.uid() resolves correctly in RLS
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { data: provider } = await supabase
    .from("profiles")
    .select(`
      subscription_active, display_name, subscription_tier,
      trial_ends_at, is_verified, is_suspended,
      monthly_quotes_used
    `)
    .eq("id", providerId)
    .single();

  if (!provider) throw new Error("Provider not found");

  // TODO: Re-enable checkProviderVisibility when admin verification UI is built.
  // Currently bypassed for MVP because all providers have id_verified,
  // business_verified, and insurance_verified as false by default,
  // and there's no admin UI to approve them yet.
  // const visibility = checkProviderVisibility({ ... });
  // if (!visibility.visible) { throw new Error(...); }

  // Basic safety checks that don't require admin verification
  if (provider.is_suspended) {
    throw new Error("Your account is suspended. Contact support for assistance.");
  }

  const bidCheck = await checkBidLimit(providerId, provider.subscription_active);
  if (!bidCheck.canBid) {
    throw new Error("Quote limit exceeded for this period. Upgrade your plan for more quotes.");
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

  // Increment monthly quote usage for paid tiers
  const tier = (provider.subscription_tier || "free") as SubscriptionTier;
  if (tier !== "free") {
    await supabase
      .from("profiles")
      .update({ monthly_quotes_used: (provider.monthly_quotes_used || 0) + 1 })
      .eq("id", providerId);
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

  // Accept this offer
  await supabase
    .from("offers")
    .update({ status: "accepted", kind: "accept" })
    .eq("id", offerId);

  // Lock the job and release contact
  const now = new Date().toISOString();
  await supabase
    .from("jobs")
    .update({
      status: "locked",
      agreed_price_cents: offer.price_cents,
      final_offer_id: offerId,
      contact_released_at: now,
    })
    .eq("id", offer.job_id);

  // Record agreement timestamp (separate call — column added by migration 007)
  try {
    await supabase
      .from("jobs")
      .update({ agreement_accepted_at: now })
      .eq("id", offer.job_id);
  } catch {
    // Column may not exist yet if migration 007 hasn't been run
  }

  // Reject all other offers
  await supabase
    .from("offers")
    .update({ status: "rejected" })
    .eq("job_id", offer.job_id)
    .neq("id", offerId);

  // Fetch full job details for the agreement email
  const { data: job } = await supabase
    .from("jobs")
    .select("title, description, location_city, location_state, junk_types")
    .eq("id", offer.job_id)
    .single();

  // Fetch provider details
  const { data: provider } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", offer.provider_id)
    .single();

  // Fetch customer details (including contact info for the provider email)
  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("email, display_name, phone_number")
    .eq("id", offer.customer_id)
    .single();

  if (provider && job && customerProfile) {
    try {
      await sendServiceAgreement({
        customerName: customerProfile.display_name,
        customerEmail: customerProfile.email,
        customerPhone: customerProfile.phone_number || null,
        providerName: provider.display_name,
        providerEmail: provider.email,
        jobTitle: job.title,
        jobDescription: job.description || "",
        jobCity: job.location_city || "",
        jobState: job.location_state || "",
        junkTypes: job.junk_types || [],
        agreedPriceCents: offer.price_cents,
        date: now,
      });
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
