import { createAdminClient } from "@/lib/supabase/admin";
import { constructWebhookEvent } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const jobId = paymentIntent.metadata?.jobId;

        if (jobId) {
          await admin
            .from("escrow_payments")
            .update({ status: "succeeded" })
            .eq("stripe_payment_intent_id", paymentIntent.id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const jobId = paymentIntent.metadata?.jobId;

        if (jobId) {
          await admin
            .from("escrow_payments")
            .update({ status: "failed" })
            .eq("stripe_payment_intent_id", paymentIntent.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await admin
            .from("escrow_payments")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .eq("subscription_stripe_customer_id", customerId)
          .single();

        if (profile) {
          const isActive =
            subscription.status === "active" || subscription.status === "trialing";

          await admin
            .from("profiles")
            .update({
              subscription_active: isActive,
              subscription_ends_at: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
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
