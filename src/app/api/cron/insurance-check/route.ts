import { NextRequest, NextResponse } from "next/server";
import { checkInsuranceExpiry } from "@/actions/insurance";

/**
 * Daily cron endpoint to check for expired provider insurance.
 * Call this via Railway cron, Vercel cron, or any scheduler.
 *
 * Protect with CRON_SECRET env var to prevent unauthorized access.
 *
 * GET /api/cron/insurance-check?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, validate it
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkInsuranceExpiry();

    return NextResponse.json({
      ok: true,
      message: `Checked insurance expiry. ${result.expired} provider(s) expired and hidden.`,
      ...result,
    });
  } catch (error) {
    console.error("Insurance check cron error:", error);
    return NextResponse.json(
      { error: "Failed to check insurance expiry" },
      { status: 500 }
    );
  }
}
