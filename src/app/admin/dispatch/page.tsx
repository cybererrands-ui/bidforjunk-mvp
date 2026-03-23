import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { formatCurrency } from "@/lib/utils";
import { PRIORITY_WEIGHTS } from "@/lib/constants";
import { JobStatus } from "@/lib/types";
import { DispatchForm } from "./dispatch-form";

export default async function AdminDispatchPage() {
  const supabase = await createClient();

  // Fetch jobs that need dispatching or are in progress
  const dispatchStatuses: JobStatus[] = [
    "accepted",
    "ready_for_dispatch",
    "dispatched",
    "in_progress",
  ];

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      description,
      location_city,
      location_state,
      location_address,
      status,
      agreed_price_cents,
      created_at,
      customer:profiles!jobs_customer_id_fkey (
        id,
        display_name,
        email
      )
    `
    )
    .in("status", dispatchStatuses)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Fetch existing dispatch assignments for these jobs
  const jobIds = (jobs || []).map((j) => j.id);
  const { data: assignments } = jobIds.length
    ? await supabase
        .from("dispatch_assignments")
        .select(
          `
          id,
          job_id,
          provider_id,
          scheduled_date,
          scheduled_time_start,
          scheduled_time_end,
          provider:profiles!dispatch_assignments_provider_id_fkey (
            id,
            display_name
          )
        `
        )
        .in("job_id", jobIds)
        .is("deleted_at", null)
    : { data: [] };

  // Build a map of job_id -> assignment for quick lookup
  const assignmentMap: Record<string, any> = {};
  if (assignments) {
    for (const a of assignments as any[]) {
      assignmentMap[a.job_id] = a;
    }
  }

  // Fetch all verified providers, sorted by priority score
  const { data: providers } = await supabase
    .from("profiles")
    .select(
      `
      id,
      display_name,
      email,
      avg_rating,
      total_jobs_completed,
      subscription_active,
      is_verified,
      service_areas,
      junk_types
    `
    )
    .eq("role", "provider")
    .eq("is_verified", true)
    .eq("is_suspended", false)
    .is("deleted_at", null);

  // Sort providers by priority: subscription_active desc, avg_rating desc, total_jobs_completed desc
  const sortedProviders = (providers || []).sort((a, b) => {
    const scoreA =
      (a.subscription_active ? PRIORITY_WEIGHTS.subscription_active : 0) +
      (a.is_verified ? PRIORITY_WEIGHTS.is_verified : 0) +
      (a.avg_rating || 0) * PRIORITY_WEIGHTS.avg_rating_multiplier +
      (a.total_jobs_completed || 0) * PRIORITY_WEIGHTS.jobs_completed_multiplier;
    const scoreB =
      (b.subscription_active ? PRIORITY_WEIGHTS.subscription_active : 0) +
      (b.is_verified ? PRIORITY_WEIGHTS.is_verified : 0) +
      (b.avg_rating || 0) * PRIORITY_WEIGHTS.avg_rating_multiplier +
      (b.total_jobs_completed || 0) * PRIORITY_WEIGHTS.jobs_completed_multiplier;
    return scoreB - scoreA;
  });

  const providerOptions = sortedProviders.map((p) => ({
    value: p.id,
    label: `${p.display_name}${p.subscription_active ? " [PRO]" : ""} — ${p.avg_rating?.toFixed(1) ?? "N/A"}★ — ${p.total_jobs_completed} jobs`,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dispatch Board</h1>
        <p className="text-gray-600 mt-2">
          Assign providers to jobs and schedule pickups
        </p>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => {
            const assignment = assignmentMap[job.id];
            const customer = job.customer as any;

            return (
              <Card key={job.id}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {job.location_city}, {job.location_state}
                    </p>
                    {job.location_address && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {job.location_address}
                      </p>
                    )}
                  </div>
                  <JobStatusBadge status={job.status as JobStatus} />
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span>
                    Customer:{" "}
                    <strong>{customer?.display_name ?? "Unknown"}</strong>
                  </span>
                  {job.agreed_price_cents && (
                    <span>
                      Price:{" "}
                      <strong className="text-brand-600">
                        {formatCurrency(job.agreed_price_cents)}
                      </strong>
                    </span>
                  )}
                </div>

                {assignment ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-800">
                      Assigned to: {(assignment.provider as any)?.display_name ?? "Unknown"}
                    </p>
                    {assignment.scheduled_date && (
                      <p className="text-green-700 mt-1">
                        Date: {assignment.scheduled_date}
                        {assignment.scheduled_time_start &&
                          ` | ${assignment.scheduled_time_start} - ${assignment.scheduled_time_end}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <DispatchForm
                    jobId={job.id}
                    providerOptions={providerOptions}
                  />
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600">
            No jobs awaiting dispatch. All caught up!
          </p>
        </Card>
      )}
    </div>
  );
}
