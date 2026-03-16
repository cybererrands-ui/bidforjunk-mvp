import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CustomerJobsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", profile.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1>My Jobs</h1>
        <Link href="/customer/jobs/new" className="btn-primary">
          Post New Job
        </Link>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/customer/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{job.title}</h3>
                  <Badge>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {[job.location_city, job.location_state].filter(Boolean).join(", ") || "Location not specified"}
                </p>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{job.description}</p>
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
              </Card>
            </Link>
          ))}
        </div>
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
