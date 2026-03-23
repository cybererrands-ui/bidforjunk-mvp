"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { createSubscriptionCheckout } from "@/lib/stripe";
import {
  SUBSCRIPTION_TIERS,
  STRIPE_PRICE_IDS,
  type SubscriptionTier,
} from "@/lib/constants";
import { revalidatePath } from "next/cache";

/* ------------------------------------------------------------------ */
/*  Create or retrieve a Stripe customer for a provider                */
/* ------------------------------------------------------------------ */

async function getOrCreateStripeCustomer(
  providerId: string,
  email: string,
  name: string
): Promise<string> {
  const admin = createAdminClient();

  // Check if provider already has a Stripe customer ID
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_stripe_customer_id")
    .eq("id", providerId)
    .single();

  if (profile?.subscription_stripe_customer_id) {
    return profile.subscription_stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      provider_id: providerId,
      platform: "bidforjunk",
    },
  });

  // Save customer ID to profile
  await admin
    .from("profiles")
    .update({ subscription_stripe_customer_id: customer.id })
    .eq("id", providerId);

  return customer.id;
}

/* ------------------------------------------------------------------ */
/*  Start a subscription checkout session                              */
/* ------------------------------------------------------------------ */

export async function startSubscriptionCheckout(tier: SubscriptionTier) {
  if (tier === "free") {
    throw new Error("Cannot start checkout for the free tier");
  }

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) {
    throw new Error(
      `Stripe price not configured for ${tier} tier. Set STRIPE_PRICE_${tier.toUpperCase()} in your environment.`
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  if (profile.role !== "provider") {
    throw new Error("Only providers can subscribe");
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(
    profile.id,
    profile.email,
    profile.display_name || "Provider"
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await createSubscriptionCheckout(
    stripeCustomerId,
    priceId,
    `${baseUrl}/provider/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    `${baseUrl}/provider/subscription/cancel`
  );

  return { url: session.url };
}

/* ------------------------------------------------------------------ */
/*  Get the current provider's subscription status                     */
/* ------------------------------------------------------------------ */

export async function getSubscriptionStatus() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `subscription_active, subscription_tier, subscription_ends_at,
       subscription_stripe_customer_id, monthly_quotes_used,
       monthly_quotes_reset_at, trial_ends_at, is_verified`
    )
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const tier = (profile.subscription_tier || "free") as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  const trialActive =
    profile.trial_ends_at !== null &&
    new Date(profile.trial_ends_at) > new Date();

  const trialDaysRemaining = trialActive
    ? Math.ceil(
        (new Date(profile.trial_ends_at!).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    tier,
    tierName: tierConfig.name,
    priceCAD: tierConfig.priceCAD,
    quoteCap: tierConfig.quoteCap,
    period: tierConfig.period,
    subscriptionActive: profile.subscription_active,
    subscriptionEndsAt: profile.subscription_ends_at,
    monthlyQuotesUsed: profile.monthly_quotes_used || 0,
    trialActive,
    trialDaysRemaining,
    trialEndsAt: profile.trial_ends_at,
    isVerified: profile.is_verified,
    hasStripeCustomer: !!profile.subscription_stripe_customer_id,
  };
}

/* ------------------------------------------------------------------ */
/*  Open Stripe billing portal (for managing subscription)             */
/* ------------------------------------------------------------------ */

export async function openBillingPortal() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.subscription_stripe_customer_id) {
    throw new Error("No active subscription to manage");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.subscription_stripe_customer_id,
    return_url: `${baseUrl}/provider/dashboard`,
  });

  return { url: session.url };
}
