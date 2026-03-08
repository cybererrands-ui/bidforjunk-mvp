import { createClient } from "@/lib/supabase/server";
import { requireProvider } from "@/components/layout/role-guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";

export default async function ProviderDashboard() {
  const user = await requireProvider();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offers")
    .select("*, jobs(*)")
    .eq("provider_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const activeJobs = (offers as any[])
    ?.filter(
      (o: any) =>
        o.jobs &&
        [
          "negotiating",
          "locked",
          "dispatched",
          "in_progress",
          "completed",
        ].includes(o.jobs.status)
    )
    .map((o: any) => o.jobs)
    .filter(
      (job: any, idx: number, arr: any[]) =>
        arr.findIndex((j: any) => j?.id === job?.id) === idx
    );

  const { data: earnings } = await supabase
    .from("jobs")
    .select("agreed_price_cents")
    .eq("status", "released")
    .in(
      "final_offer_id",
      (offers || []).map((o) => o.id)
    );

  const totalEarnings =
    earnings?.reduce((sum, job) => sum + (job.agreed_price_cents || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1>Provider Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {user.display_name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="text-gray-600 text-sm">Active Jobs</div>
          <div className="text-3xl font-bold mt-2">
            {activeJobs?.length || 0}
          </div>
        </Card>

        <Card>
          <div className="text-gray-600 text-sm">Total Bids</div>
          <div className="text-3xl font-bold mt-2">{offers?.length || 0}</div>
        </Card>

        <Card>
          <div className="text-gray-600 text-sm">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totalEarnings)}
          </div>
        </Card>
      </div>

      {activeJobs && activeJobs.length > 0 ? (
        <Card>
          <h2 className="font-semibold text-lg mb-4">Active Jobs</h2>
          <div className="space-y-4">
            {activeJobs.map(
              (job: any) =>
                job && (
                  <Link key={job.id} href={`/provider/jobs/${job.id}`}>
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{job.title}</h3>
                        <Badge>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {job.location_city}, {job.location_state}
                      </p>
                      <div className="flex justify-between items-center">
                        {job.agreed_price_cents ? (
                          <span className="font-semibold">
                            {formatCurrency(job.agreed_price_cents)}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Awaiting agreement
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {timeAgo(job.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
            )}
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No active jobs yet</p>
          <Link href="/provider/jobs" className="btn-primary">
            Browse Available Jobs
          </Link>
        </Card>
      )}
    </div>
  );
}
