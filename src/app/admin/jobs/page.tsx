import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, SILENT_SIDE_RELEASE_HOURS } from "@/lib/constants";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import Link from "next/link";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Fetch all jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, customer:profiles!jobs_customer_id_fkey(display_name, email)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Find jobs pending admin release: completed + provider confirmed > 48h ago + customer NOT confirmed
  const { data: confirmations } = await admin
    .from("confirmations")
    .select("*, jobs(id, title, status, agreed_price_cents, customer_id)")
    .eq("provider_confirmed", true)
    .eq("customer_confirmed", false)
    .is("deleted_at", null);

  const now = new Date();
  const pendingAdminRelease = (confirmations || []).filter((c: any) => {
    if (!c.provider_confirmed_at) return false;
    const confirmedAt = new Date(c.provider_confirmed_at);
    const hoursSince = (now.getTime() - confirmedAt.getTime()) / (1000 * 60 * 60);
    return hoursSince >= SILENT_SIDE_RELEASE_HOURS;
  });

  // Fetch offers/providers for pending release jobs
  const pendingJobIds = pendingAdminRelease.map((c: any) => {
    const jobData = Array.isArray(c.jobs) ? c.jobs[0] : c.jobs;
    return jobData?.id;
  }).filter(Boolean);

  const { data: pendingOffers } = pendingJobIds.length > 0
    ? await admin
        .from("offers")
        .select("*, provider:profiles!offers_provider_id_fkey(display_name)")
        .in("job_id", pendingJobIds)
        .eq("status", "accepted")
    : { data: [] };

  const offerByJob: Record<string, any> = {};
  (pendingOffers || []).forEach((o: any) => {
    offerByJob[o.job_id] = o;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1>All Jobs</h1>
        <p className="text-gray-600 mt-2">Monitor all job postings on the platform</p>
      </div>

      {/* Pending Admin Release Section */}
      {pendingAdminRelease.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            Pending Admin Release ({pendingAdminRelease.length})
          </h2>
          <p className="text-sm text-gray-600">
            These jobs were marked complete by the provider over 48 hours ago, but the customer hasn&apos;t confirmed.
          </p>
          <div className="grid gap-4">
            {pendingAdminRelease.map((conf: any) => {
              const jobData = Array.isArray(conf.jobs) ? conf.jobs[0] : conf.jobs;
              if (!jobData) return null;
              const offer = offerByJob[jobData.id];
              const providerRaw = offer?.provider;
              const provider = Array.isArray(providerRaw) ? providerRaw[0] : providerRaw;

              return (
                <Card key={conf.id} className="border-amber-300 bg-amber-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{jobData.title}</h3>
                      <p className="text-sm text-gray-600">
                        Provider: {provider?.display_name || "Unknown"} • Agreed: {jobData.agreed_price_cents ? formatCurrency(jobData.agreed_price_cents) : "N/A"}
                      </p>
                    </div>
                    <Badge variant="warning">Pending Release</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Provider confirmed: {formatDate(conf.provider_confirmed_at)} ({timeAgo(conf.provider_confirmed_at)})
                  </div>
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server";
                      const { createClient: createServerClient } = await import("@/lib/supabase/server");
                      const sb = await createServerClient();
                      await sb.from("jobs").update({ status: "released" }).eq("id", jobData.id);
                      const { revalidatePath } = await import("next/cache");
                      revalidatePath("/admin/jobs");
                    }}>
                      <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        Release Job
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      const { createClient: createServerClient } = await import("@/lib/supabase/server");
                      const sb = await createServerClient();
                      await sb.from("jobs").update({ status: "cancelled" }).eq("id", jobData.id);
                      const { revalidatePath } = await import("next/cache");
                      revalidatePath("/admin/jobs");
                    }}>
                      <button type="submit" className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50">
                        Refund Customer
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">All Jobs ({jobs?.length || 0})</h2>
        {jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const customerRaw = (job as any).customer;
              const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;

              return (
                <Card key={job.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {job.location_city}, {job.location_state} • Customer: {customer?.display_name || "Unknown"}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-800"}`}>
                      {JOB_STATUS_LABELS[job.status] || job.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-1">{job.description}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-sm">
                    <div className="flex items-center gap-4">
                      {job.agreed_price_cents ? (
                        <span className="font-semibold text-green-600">{formatCurrency(job.agreed_price_cents)}</span>
                      ) : job.budget_cents ? (
                        <span className="text-gray-600">Budget: {formatCurrency(job.budget_cents)}</span>
                      ) : (
                        <span className="text-gray-400">No budget set</span>
                      )}
                    </div>
                    <span className="text-gray-400">{timeAgo(job.created_at)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-600">No jobs found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
