"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createEscrowHold,
  captureEscrow,
  refundEscrow,
  voidEscrow,
} from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function createEscrowPayment(
  jobId: string,
  customerId: string,
  providerId: string,
  amountCents: number
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("subscription_stripe_customer_id")
    .eq("id", customerId)
    .single();

  if (!customerProfile?.subscription_stripe_customer_id) {
    throw new Error("Customer has no Stripe account");
  }

  const paymentIntent = await createEscrowHold(
    customerProfile.subscription_stripe_customer_id,
    amountCents,
    jobId
  );

  const { data: escrow, error } = await admin
    .from("escrow_payments")
    .insert({
      job_id: jobId,
      customer_id: customerId,
      provider_id: providerId,
      stripe_payment_intent_id: paymentIntent.id,
      amount_cents: amountCents,
      status: paymentIntent.status,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/customer/jobs/${jobId}`);
  return {
    escrowId: escrow!.id,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
}

export async function releaseEscrow(jobId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: escrow } = await supabase
    .from("escrow_payments")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!escrow) throw new Error("Escrow payment not found");

  const paymentIntent = await captureEscrow(escrow.stripe_payment_intent_id);

  await admin
    .from("escrow_payments")
    .update({ status: paymentIntent.status })
    .eq("id", escrow.id);

  await admin.from("jobs").update({ status: "released" }).eq("id", jobId);

  revalidatePath(`/customer/jobs/${jobId}`);
  return { status: "released" };
}

export async function cancelEscrow(jobId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: escrow } = await supabase
    .from("escrow_payments")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!escrow) throw new Error("Escrow payment not found");

  const paymentIntent = await voidEscrow(escrow.stripe_payment_intent_id);

  await admin
    .from("escrow_payments")
    .update({ status: paymentIntent.status })
    .eq("id", escrow.id);

  revalidatePath(`/customer/jobs/${jobId}`);
  return { status: "cancelled" };
}

export async function refundEscrowPayment(jobId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: escrow } = await supabase
    .from("escrow_payments")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!escrow) throw new Error("Escrow payment not found");

  await refundEscrow(escrow.stripe_payment_intent_id, escrow.amount_cents);

  await admin
    .from("escrow_payments")
    .update({ status: "refunded" })
    .eq("id", escrow.id);

  revalidatePath(`/customer/jobs/${jobId}`);
  return { status: "refunded" };
}
