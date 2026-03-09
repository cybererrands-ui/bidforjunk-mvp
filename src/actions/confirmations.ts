"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIRMATION_DEADLINE_HOURS, SILENT_SIDE_RELEASE_HOURS } from "@/lib/constants";
import { releaseEscrow } from "@/actions/escrow";
import { revalidatePath } from "next/cache";
import { addHours, differenceInHours } from "date-fns";

export async function confirmCompletion(
  jobId: string,
  confirmedBy: "provider" | "customer"
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: job } = await supabase
    .from("jobs")
    .select("status, customer_id, final_offer_id")
    .eq("id", jobId)
    .single();

  if (!job || (job.status !== "completed" && job.status !== "in_progress")) {
    throw new Error("Job is not in a completable state");
  }

  // If job is in_progress, transition to completed first
  if (job.status === "in_progress") {
    await admin.from("jobs").update({ status: "completed" }).eq("id", jobId);
  }

  let { data: confirmation } = await supabase
    .from("confirmations")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!confirmation) {
    const deadline = addHours(new Date(), CONFIRMATION_DEADLINE_HOURS);
    const { data: newConfirm } = await admin
      .from("confirmations")
      .insert({ job_id: jobId, deadline_at: deadline.toISOString() })
      .select()
      .single();
    confirmation = newConfirm;
  }

  if (confirmedBy === "provider") {
    await admin
      .from("confirmations")
      .update({ provider_confirmed: true, provider_confirmed_at: new Date().toISOString() })
      .eq("job_id", jobId);
  } else {
    await admin
      .from("confirmations")
      .update({ customer_confirmed: true, customer_confirmed_at: new Date().toISOString() })
      .eq("job_id", jobId);
  }

  const { data: updatedConfirm } = await supabase
    .from("confirmations")
    .select("*")
    .eq("job_id", jobId)
    .single();

  // Both sides confirmed -- release escrow immediately
  if (updatedConfirm?.provider_confirmed && updatedConfirm?.customer_confirmed) {
    await releaseEscrow(jobId);
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  return { confirmed: true };
}

/**
 * Checks whether the provider confirmed completion more than
 * SILENT_SIDE_RELEASE_HOURS ago while the customer has NOT confirmed.
 * Returns true when the job qualifies for admin-mediated release.
 */
export async function checkSilentSideRelease(jobId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: confirmation } = await supabase
    .from("confirmations")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!confirmation) return false;

  // Provider must have confirmed, customer must NOT have confirmed
  if (!confirmation.provider_confirmed || confirmation.customer_confirmed) {
    return false;
  }

  if (!confirmation.provider_confirmed_at) return false;

  const providerConfirmedAt = new Date(confirmation.provider_confirmed_at);
  const hoursSinceProviderConfirmed = differenceInHours(new Date(), providerConfirmedAt);

  return hoursSinceProviderConfirmed >= SILENT_SIDE_RELEASE_HOURS;
}

export async function autoReleaseEscrow(jobId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: confirmation } = await supabase
    .from("confirmations")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (!confirmation) throw new Error("Confirmation not found");

  const now = new Date();
  const deadline = new Date(confirmation.deadline_at);
  if (now < deadline) throw new Error("Deadline not reached");

  await admin.from("confirmations").update({ auto_released: true }).eq("job_id", jobId);
  await releaseEscrow(jobId);

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
  return { auto_released: true };
}
