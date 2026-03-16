import { createClient } from "@/lib/supabase/server";
import { requireProvider } from "@/components/layout/role-guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JUNK_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export default async function ProviderJobsPage() {
  const user = await requireProvider();
  const supabase = await createClient();
  await supabase.auth.getUser(); // Force session validation for RLS

  // All open/negotiating jobs — every hauler sees everything
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .in("status", ["open", "negotiating"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Failed to load jobs:", jobsError);
  }

  // Exclude jobs this provider already bid on (they'll see those in their dashboard)
  let filteredJobs = jobs || [];
  const { data: myOffers } = await supabase
    .from("offers")
    .select("job_id")
    .eq("provider_id", user.id)
    .is("deleted_at", null);

  if (myOffers && myOffers.length > 0) {
    const myJobIds = new Set(myOffers.map((o) => o.job_id));
    filteredJobs = filteredJobs.filter((job) => !myJobIds.has(job.id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>Available Jobs</h1>
        <p className="text-gray-600 mt-2">
          Browse and bid on junk removal jobs across Canada
        </p>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid gap-6">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/provider/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {[job.location_city, job.location_state].filter(Boolean).join(", ") || "Location not specified"}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.junk_types.map((type: string) => (
                    <Badge key={type} variant="info">
                      {JUNK_TYPES[type as keyof typeof JUNK_TYPES]}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    {timeAgo(job.created_at)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-2">No jobs available yet.</p>
          <p className="text-sm text-gray-500">
            New jobs are posted regularly. Check back soon!
          </p>
        </Card>
      )}
    </div>
  );
}
