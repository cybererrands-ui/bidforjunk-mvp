import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default async function AdminJobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1>All Jobs</h1>
        <p className="text-gray-600 mt-2">
          Monitor all job postings on the platform
        </p>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-gray-600 text-sm">
                    {job.location_city}, {job.location_state}
                  </p>
                </div>
                <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {job.description}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                {job.agreed_price_cents ? (
                  <span className="font-semibold">
                    {formatCurrency(job.agreed_price_cents)}
                  </span>
                ) : (
                  <span className="text-gray-500">Price TBD</span>
                )}
                <span className="text-sm text-gray-500">
                  {timeAgo(job.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600">No jobs found</p>
        </Card>
      )}
    </div>
  );
}
