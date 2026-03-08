import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", profile.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const activeJobs = jobs?.filter((j) =>
    ["open", "negotiating", "locked", "dispatched", "in_progress"].includes(
      j.status
    )
  );
  const completedJobs = jobs?.filter((j) =>
    ["completed", "released"].includes(j.status)
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1>My Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {profile.display_name}</p>
        </div>
        <Link href="/customer/jobs/new" className="btn-primary">
          Post New Job
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <p className="text-gray-600 text-sm">Active Jobs</p>
          <p className="text-3xl font-bold mt-2">{activeJobs?.length || 0}</p>
        </Card>
        <Card>
          <p className="text-gray-600 text-sm">Completed Jobs</p>
          <p className="text-3xl font-bold mt-2">
            {completedJobs?.length || 0}
          </p>
        </Card>
        <Card>
          <p className="text-gray-600 text-sm">Total Jobs</p>
          <p className="text-3xl font-bold mt-2">{jobs?.length || 0}</p>
        </Card>
      </div>

      {jobs && jobs.length > 0 ? (
        <Card>
          <h2 className="font-semibold text-lg mb-4">Recent Jobs</h2>
          <div className="space-y-4">
            {jobs.slice(0, 10).map((job) => (
              <Link key={job.id} href={`/customer/jobs/${job.id}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{job.title}</h3>
                    <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {job.location_city}, {job.location_state}
                  </p>
                  <div className="flex justify-between items-center">
                    {job.agreed_price_cents ? (
                      <span className="font-semibold text-green-600">
                        {formatCurrency(job.agreed_price_cents)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Awaiting bids</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No jobs posted yet</p>
          <Link href="/customer/jobs/new" className="btn-primary">
            Post Your First Job
          </Link>
        </Card>
      )}
    </div>
  );
}
