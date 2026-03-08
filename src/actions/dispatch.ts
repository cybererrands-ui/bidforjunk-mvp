"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDispatchNotification } from "@/lib/resend";
import { revalidatePath } from "next/cache";

export async function assignDispatch(
  jobId: string,
  providerId: string,
  scheduledDate?: string,
  scheduledTimeStart?: string,
  scheduledTimeEnd?: string
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
    throw new Error("Only admins can assign dispatch");
  }

  const { data: assignment, error } = await admin
    .from("dispatch_assignments")
    .insert({
      job_id: jobId,
      provider_id: providerId,
      admin_id: profile.id,
      scheduled_date: scheduledDate || null,
      scheduled_time_start: scheduledTimeStart || null,
      scheduled_time_end: scheduledTimeEnd || null,
    })
    .select()
    .single();

  if (error) throw error;

  await admin.from("jobs").update({ status: "dispatched" }).eq("id", jobId);

  const { data: provider } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", providerId)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", jobId)
    .single();

  if (provider && job) {
    try {
      const timeWindow = scheduledTimeStart
        ? `${scheduledTimeStart} - ${scheduledTimeEnd}`
        : "TBD";
      await sendDispatchNotification(
        provider.email,
        job.title,
        scheduledDate || new Date().toISOString(),
        timeWindow
      );
    } catch {
      // Continue even if email fails
    }

    await admin.from("notifications").insert({
      user_id: providerId,
      type: "dispatchNotification",
      title: "Job Dispatch",
      message: `You have been assigned to ${job.title}`,
      related_job_id: jobId,
    });
  }

  revalidatePath("/admin/dispatch");
  revalidatePath(`/provider/jobs/${jobId}`);
  return assignment;
}

export async function markInProgress(jobId: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("jobs")
    .update({ status: "in_progress" })
    .eq("id", jobId);

  if (error) throw error;
  revalidatePath(`/provider/jobs/${jobId}`);
  return { status: "in_progress" };
}
