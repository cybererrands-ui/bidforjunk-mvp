"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResolutionType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function openDispute(jobId: string, reason: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: dispute, error } = await admin
    .from("disputes")
    .insert({
      job_id: jobId,
      opened_by_id: profile.id,
      reason,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;

  await admin.from("jobs").update({ status: "disputed" }).eq("id", jobId);

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  return dispute;
}

export async function uploadDisputeEvidence(
  disputeId: string,
  file: File,
  description?: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const filename = `${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("dispute-evidence")
    .upload(`${profile.id}/${disputeId}/${filename}`, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("dispute-evidence").getPublicUrl(uploadData.path);

  const { data: evidence, error } = await admin
    .from("dispute_evidence")
    .insert({
      dispute_id: disputeId,
      uploaded_by_id: profile.id,
      file_url: publicUrl,
      file_type: file.type,
      description: description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return evidence;
}

export async function resolveDispute(
  disputeId: string,
  resolutionType: ResolutionType,
  notes?: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can resolve disputes");
  }

  const { data: dispute } = await supabase
    .from("disputes")
    .select("*")
    .eq("id", disputeId)
    .single();

  if (!dispute) throw new Error("Dispute not found");

  const { error } = await admin
    .from("disputes")
    .update({
      status: "resolved",
      resolution_type: resolutionType,
      notes: notes || null,
    })
    .eq("id", disputeId);

  if (error) throw error;

  if (resolutionType === "customer_refund" || resolutionType === "split") {
    await admin.from("jobs").update({ status: "cancelled" }).eq("id", dispute.job_id);
  } else if (resolutionType === "provider_payment") {
    await admin.from("jobs").update({ status: "released" }).eq("id", dispute.job_id);
  }

  revalidatePath(`/admin/disputes`);
  return dispute;
}
