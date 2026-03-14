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

// ── Granular verification actions (ID / Business / Insurance) ───────

export type VerificationCategory = "id" | "business" | "insurance";

export async function reviewProviderCategory(
  providerId: string,
  category: VerificationCategory,
  approved: boolean,
  rejectionNote?: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", userData.user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can review verifications");
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};

  switch (category) {
    case "id":
      update.id_verified = approved;
      update.id_verified_at = approved ? now : null;
      update.id_rejection_note = !approved ? (rejectionNote || null) : null;
      break;
    case "business":
      update.business_verified = approved;
      update.business_verified_at = approved ? now : null;
      update.business_rejection_note = !approved ? (rejectionNote || null) : null;
      break;
    case "insurance":
      update.insurance_verified = approved;
      update.insurance_verified_at = approved ? now : null;
      update.insurance_rejection_note = !approved ? (rejectionNote || null) : null;
      // Check insurance expiry
      if (approved) {
        update.insurance_expired = false;
      }
      break;
  }

  const { error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", providerId);

  if (error) throw error;

  // Check if all three are now approved — set master is_verified
  const { data: provider } = await admin
    .from("profiles")
    .select("id_verified, business_verified, insurance_verified")
    .eq("id", providerId)
    .single();

  if (provider) {
    const allVerified =
      provider.id_verified && provider.business_verified && provider.insurance_verified;

    await admin
      .from("profiles")
      .update({
        is_verified: allVerified,
        verified_at: allVerified ? now : null,
      })
      .eq("id", providerId);
  }

  revalidatePath("/admin/verifications");
  return { category, approved };
}

/** Get all providers with their verification details for admin review */
export async function getProvidersForVerification() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can view verifications");
  }

  // Fetch all providers who have submitted at least one verification document
  const { data: providers } = await supabase
    .from("profiles")
    .select(`
      id, display_name, email, avatar_url, phone_number, created_at,
      is_verified, is_suspended,
      trial_ends_at, subscription_active, subscription_tier,
      legal_full_name, date_of_birth, id_type, id_expiry_date, id_document_url,
      id_verified, id_verified_at, id_rejection_note,
      legal_business_name, operating_name, business_registration_number,
      province_of_registration, business_type, business_address, business_phone,
      business_email, business_website,
      business_verified, business_verified_at, business_rejection_note,
      insurer_name, insurance_policy_number, insurance_coverage_type,
      insurance_coverage_amount, insurance_effective_date, insurance_expiry_date,
      insurance_certificate_url,
      insurance_verified, insurance_verified_at, insurance_rejection_note,
      insurance_expired,
      truck_size, crew_size, same_day_available, service_areas
    `)
    .eq("role", "provider")
    .order("created_at", { ascending: false });

  return providers || [];
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

/** Comprehensive dashboard data for the admin command center */
export async function getAdminDashboardData() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Only admins can view dashboard");
  }

  // --- All counts in parallel ---
  const [
    { count: totalUsers },
    { count: totalCustomers },
    { count: totalProviders },
    { count: totalJobs },
    { count: activeJobs },
    { count: releasedJobs },
    { count: cancelledJobs },
    { count: pendingVerifications },
    { count: openDisputes },
    { count: dispatchQueue },
    { count: trialUsers },
    { count: paidUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "provider"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("jobs").select("*", { count: "exact", head: true }).in("status", ["open", "negotiating", "locked", "escrow_authorized", "ready_for_dispatch", "dispatched", "in_progress"]),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "released"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("provider_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).in("status", ["escrow_authorized", "ready_for_dispatch"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "provider").eq("subscription_active", false).not("trial_ends_at", "is", null),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "provider").eq("subscription_active", true),
  ]);

  // --- Escrow totals ---
  const [{ data: escrowHeld }, { data: escrowReleased }] = await Promise.all([
    supabase.from("escrow_payments").select("amount_cents").in("status", ["requires_capture", "processing"]).is("deleted_at", null),
    supabase.from("escrow_payments").select("amount_cents").eq("status", "succeeded").is("deleted_at", null),
  ]);

  const totalEscrowHeld = escrowHeld?.reduce((s: number, e) => s + e.amount_cents, 0) || 0;
  const totalEscrowReleased = escrowReleased?.reduce((s: number, e) => s + e.amount_cents, 0) || 0;

  // --- Pending admin release ---
  const { data: confirmations } = await supabase
    .from("confirmations")
    .select("provider_confirmed_at")
    .eq("provider_confirmed", true)
    .eq("customer_confirmed", false)
    .is("deleted_at", null);

  const now = new Date();
  const pendingRelease = (confirmations || []).filter((c) => {
    if (!c.provider_confirmed_at) return false;
    const hours = (now.getTime() - new Date(c.provider_confirmed_at).getTime()) / (1000 * 60 * 60);
    return hours >= 48;
  }).length;

  // --- Job pipeline (count per status) ---
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("status")
    .is("deleted_at", null);

  const pipeline: Record<string, number> = {};
  (allJobs || []).forEach((j) => {
    pipeline[j.status] = (pipeline[j.status] || 0) + 1;
  });

  // --- Recent jobs (last 10) with customer name ---
  const { data: recentJobsRaw } = await supabase
    .from("jobs")
    .select("id, title, status, created_at, agreed_price_cents, budget_cents, location_city, profiles!jobs_customer_id_fkey(display_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentJobs = (recentJobsRaw || []).map((j: any) => {
    const cust = Array.isArray(j.profiles) ? j.profiles[0] : j.profiles;
    return {
      id: j.id,
      title: j.title,
      status: j.status,
      created_at: j.created_at,
      agreed_price_cents: j.agreed_price_cents,
      budget_cents: j.budget_cents,
      location_city: j.location_city,
      customer_name: cust?.display_name || "Unknown",
    };
  });

  // --- Recent signups (last 10) ---
  const { data: recentSignups } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, created_at, is_verified, subscription_active")
    .order("created_at", { ascending: false })
    .limit(10);

  // --- Top providers ---
  const { data: topProviders } = await supabase
    .from("profiles")
    .select("id, display_name, avg_rating, total_jobs_completed, subscription_active, is_verified")
    .eq("role", "provider")
    .order("total_jobs_completed", { ascending: false })
    .limit(5);

  return {
    kpi: {
      totalUsers: totalUsers || 0,
      totalCustomers: totalCustomers || 0,
      totalProviders: totalProviders || 0,
      totalJobs: totalJobs || 0,
      activeJobs: activeJobs || 0,
      releasedJobs: releasedJobs || 0,
      cancelledJobs: cancelledJobs || 0,
      totalEscrowHeld,
      totalEscrowReleased,
    },
    actionItems: {
      pendingVerifications: pendingVerifications || 0,
      openDisputes: openDisputes || 0,
      dispatchQueue: dispatchQueue || 0,
      pendingRelease,
    },
    pipeline,
    subscriptions: {
      trial: trialUsers || 0,
      paid: paidUsers || 0,
      free: Math.max(0, (totalProviders || 0) - (trialUsers || 0) - (paidUsers || 0)),
    },
    recentJobs,
    recentSignups: recentSignups || [],
    topProviders: topProviders || [],
  };
}
