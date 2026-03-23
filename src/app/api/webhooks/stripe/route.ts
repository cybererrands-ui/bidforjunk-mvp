import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/stripe";
import { STRIPE_PRICE_IDS } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Resolve tier name from a Stripe price ID by matching against env config.
 * Returns "starter" | "growth" | "dominator" or "starter" as fallback.
 */
function tierFromPriceId(priceId: string): string {
  for (const [tier, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id && id === priceId) return tier;
  }
  return "starter"; // safe fallback
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  try {
    const event = constructWebhookEvent(body, signature);
    const admin = createAdminClient();

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await admin
          .from("profiles")
          .select("id, monthly_quotes_reset_at")
          .eq("subscription_stripe_customer_id", customerId)
          .single();

        if (profile) {
          const isActive =
            subscription.status === "active" || subscription.status === "trialing";

          // Determine tier from Stripe price
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const tier = priceId ? tierFromPriceId(priceId) : undefined;

          // Calculate period start for quota reset
          const periodStart = subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : null;

          // Reset monthly quota if the billing period rolled over
          const shouldResetQuota =
            periodStart &&
            (!profile.monthly_quotes_reset_at ||
              periodStart > profile.monthly_quotes_reset_at);

          const updatePayload: Record<string, unknown> = {
            subscription_active: isActive,
            subscription_ends_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          };

          if (tier) {
            updatePayload.subscription_tier = tier;
          }

          if (shouldResetQuota) {
            updatePayload.monthly_quotes_used = 0;
            updatePayload.monthly_quotes_reset_at = periodStart;
          }

          await admin
            .from("profiles")
            .update(updatePayload)
            .eq("id", profile.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .eq("subscription_stripe_customer_id", customerId)
          .single();

        if (profile) {
          await admin
            .from("profiles")
            .update({
              subscription_active: false,
              subscription_tier: "free",
            })
            .eq("id", profile.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
