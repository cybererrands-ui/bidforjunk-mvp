import Stripe from "stripe";
import { STRIPE_CAPTURE_METHOD, CURRENCY } from "@/lib/constants";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export { stripe };

export async function createEscrowHold(
  customerId: string,
  amountCents: number,
  jobId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: CURRENCY.toLowerCase(),
    customer: customerId,
    capture_method: STRIPE_CAPTURE_METHOD,
    metadata: {
      jobId,
      type: "escrow_hold",
    },
    statement_descriptor: `BidForJunk Job ${jobId.slice(0, 8)}`,
  });

  return paymentIntent;
}

export async function captureEscrow(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent =
    await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

export async function voidEscrow(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent =
    await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
}

export async function refundEscrow(
  paymentIntentId: string,
  amountCents?: number
): Promise<Stripe.Refund> {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
  });

  return refund;
}

export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        type: "provider_unlimited_bids",
      },
    },
  });

  return session;
}

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  return event;
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent =
    await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}
