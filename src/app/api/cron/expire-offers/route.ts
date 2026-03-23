import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Cron endpoint: auto-expire offers past their expires_at deadline.
 * Should be called periodically (e.g., every hour) via cron-job.org.
 */
export async function POST() {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Find and expire all active offers whose expires_at is in the past
    const { data: expiredOffers, error } = await admin
      .from("offers")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", now)
      .select("id, job_id");

    if (error) {
      console.error("Failed to expire offers:", error);
      return NextResponse.json(
        { error: "Failed to expire offers" },
        { status: 500 }
      );
    }

    const expiredCount = expiredOffers?.length || 0;

    // For jobs where ALL offers are now expired/rejected, revert to "open"
    if (expiredOffers && expiredOffers.length > 0) {
      const jobIds = [...new Set(expiredOffers.map((o) => o.job_id))];

      for (const jobId of jobIds) {
        // Check if job still has any active offers
        const { count } = await admin
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("job_id", jobId)
          .eq("status", "active");

        if (count === 0) {
          // Check job is in negotiating state
          const { data: job } = await admin
            .from("jobs")
            .select("status")
            .eq("id", jobId)
            .single();

          if (job?.status === "negotiating") {
            await admin
              .from("jobs")
              .update({ status: "open" })
              .eq("id", jobId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      expired_count: expiredCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Offer expiry cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser/cron testing
export async function GET() {
  return POST();
}
