"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Check all providers for insurance expiry and auto-hide expired ones.
 * This should be called periodically (e.g., daily via cron or API route).
 */
export async function checkInsuranceExpiry() {
  const admin = createAdminClient();
  const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Find all providers whose insurance has expired but are NOT yet flagged
  const { data: expiredProviders, error: fetchError } = await admin
    .from("profiles")
    .select("id, display_name, insurance_expiry_date")
    .eq("role", "provider")
    .eq("insurance_expired", false)
    .eq("insurance_verified", true)
    .not("insurance_expiry_date", "is", null)
    .lte("insurance_expiry_date", now);

  if (fetchError) throw fetchError;

  if (!expiredProviders || expiredProviders.length === 0) {
    return { expired: 0, providers: [] };
  }

  // Mark each as expired
  const expiredIds = expiredProviders.map((p) => p.id);

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      insurance_expired: true,
      insurance_verified: false,
      is_verified: false,
    })
    .in("id", expiredIds);

  if (updateError) throw updateError;

  revalidatePath("/admin/verifications");
  revalidatePath("/admin/dashboard");

  return {
    expired: expiredProviders.length,
    providers: expiredProviders.map((p) => ({
      id: p.id,
      name: p.display_name,
      expiry: p.insurance_expiry_date,
    })),
  };
}

/**
 * Get providers whose insurance is expiring soon (within N days).
 * Used for admin dashboard alerts and email reminders.
 */
export async function getExpiringInsurance(withinDays: number = 30) {
  const admin = createAdminClient();
  const now = new Date();
  const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  const futureDateStr = futureDate.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const { data: providers, error } = await admin
    .from("profiles")
    .select("id, display_name, email, insurance_expiry_date, insurer_name")
    .eq("role", "provider")
    .eq("insurance_verified", true)
    .eq("insurance_expired", false)
    .not("insurance_expiry_date", "is", null)
    .gte("insurance_expiry_date", todayStr)
    .lte("insurance_expiry_date", futureDateStr)
    .order("insurance_expiry_date", { ascending: true });

  if (error) throw error;

  return (providers || []).map((p) => {
    const daysLeft = Math.ceil(
      (new Date(p.insurance_expiry_date!).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return {
      id: p.id,
      name: p.display_name,
      email: p.email,
      insurer: p.insurer_name,
      expiryDate: p.insurance_expiry_date,
      daysLeft,
    };
  });
}
