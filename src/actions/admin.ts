"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function reviewVerification(
  verificationId: string,
  approved: boolean,
  rejectionReason?: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can review verifications");
  }

  const status = approved ? "approved" : "rejected";

  const { error } = await admin
    .from("provider_verifications")
    .update({
      status,
      verified_by_id: profile.id,
      verified_at: approved ? new Date().toISOString() : null,
      rejection_reason: !approved ? rejectionReason || null : null,
    })
    .eq("id", verificationId);

  if (error) throw error;

  if (approved) {
    const { data: verification } = await supabase
      .from("provider_verifications")
      .select("provider_id")
      .eq("id", verificationId)
      .single();

    if (verification) {
      await admin
        .from("profiles")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("id", verification.provider_id);
    }
  }

  revalidatePath("/admin/verifications");
  return { status };
}

export async function suspendUser(userId: string, reason: string) {
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
    throw new Error("Only admins can suspend users");
  }

  const { error } = await admin
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  revalidatePath("/admin/users");
  return { suspended: true };
}

export async function unsuspendUser(userId: string) {
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
    throw new Error("Only admins can unsuspend users");
  }

  const { error } = await admin
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_reason: null,
      suspended_at: null,
    })
    .eq("id", userId);

  if (error) throw error;
  revalidatePath("/admin/users");
  return { suspended: false };
}

export async function getAdminMetrics() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can view metrics");
  }

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  const { count: activeJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "negotiating", "locked", "dispatched", "in_progress"]);

  const { count: pendingVerifications } = await supabase
    .from("provider_verifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: openDisputes } = await supabase
    .from("disputes")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { data: escrowData } = await supabase
    .from("escrow_payments")
    .select("amount_cents")
    .is("deleted_at", null);

  const totalEscrow = escrowData?.reduce((sum: number, e) => sum + e.amount_cents, 0) || 0;

  return { totalUsers, totalJobs, activeJobs, pendingVerifications, openDisputes, totalEscrow };
}
