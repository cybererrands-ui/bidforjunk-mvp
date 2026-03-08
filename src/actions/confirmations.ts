"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIRMATION_DEADLINE_HOURS } from "@/lib/constants";
import { releaseEscrow } from "@/actions/escrow";
import { revalidatePath } from "next/cache";
import { addHours } from "date-fns";

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

  if (!job || job.status !== "completed") {
    throw new Error("Job is not in completed state");
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

  if (updatedConfirm?.provider_confirmed && updatedConfirm?.customer_confirmed) {
    await releaseEscrow(jobId);
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  return { confirmed: true };
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
  return { auto_released: true };
}
