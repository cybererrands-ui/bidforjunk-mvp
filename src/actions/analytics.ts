"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAnalyticsData() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  if (profile.role === "provider") {
    const { data: completedJobs } = await supabase
      .from("jobs")
      .select("agreed_price_cents")
      .eq("status", "released")
      .is("deleted_at", null);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .is("deleted_at", null);

    const totalEarnings =
      completedJobs?.reduce((sum: number, job) => sum + (job.agreed_price_cents || 0), 0) || 0;
    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      totalEarnings,
      jobsCompleted: completedJobs?.length || 0,
      avgRating: Math.round(avgRating * 100) / 100,
      totalReviews: reviews?.length || 0,
    };
  }

  if (profile.role === "customer") {
    const { count: jobsPosted } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    const { count: jobsCompleted } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "released");

    return {
      jobsPosted: jobsPosted || 0,
      jobsCompleted: jobsCompleted || 0,
    };
  }

  return {};
}
