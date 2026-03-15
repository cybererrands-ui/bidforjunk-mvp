import { createClient } from "@/lib/supabase/server";
import { requireProvider } from "@/components/layout/role-guard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JUNK_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import { normalizeServiceAreaSlug } from "@/lib/canadian-cities";
import Link from "next/link";

export default async function ProviderJobsPage() {
  const user = await requireProvider();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("service_areas, junk_types")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Failed to load provider profile:", profileError);
  }

  // Show jobs that are open (no bids yet) or negotiating (bids exist but
  // customer hasn't accepted one — other providers can still compete)
  let query = supabase
    .from("jobs")
    .select("*")
    .in("status", ["open", "negotiating"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (profile?.service_areas && profile.service_areas.length > 0) {
    // Normalize service areas to canonical slugs for consistent matching
    const slugs = (profile.service_areas as string[]).map((c: string) =>
      normalizeServiceAreaSlug(c)
    ).filter(Boolean);
    if (slugs.length > 0) {
      query = query.in("location_city_slug", slugs);
    }
  }

  const { data: jobs, error: jobsError } = await query;

  if (jobsError) {
    console.error("Failed to load jobs:", jobsError);
  }

  // Filter by junk types if provider has preferences set
  let filteredJobs = (jobs || []).filter((job) => {
    if (!profile?.junk_types || profile.junk_types.length === 0) return true;
    return job.junk_types.some((type: string) =>
      (profile.junk_types as string[]).includes(type)
    );
  });

  // Exclude jobs this provider already bid on (they'll see those in their dashboard)
  const { data: myOffers } = await supabase
    .from("offers")
    .select("job_id")
    .eq("provider_id", user.id)
    .is("deleted_at", null);

  if (myOffers && myOffers.length > 0) {
    const myJobIds = new Set(myOffers.map((o) => o.job_id));
    filteredJobs = filteredJobs.filter((job) => !myJobIds.has(job.id));
  }

  const hasServiceAreas = profile?.service_areas && profile.service_areas.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1>Available Jobs</h1>
        <p className="text-gray-600 mt-2">
          Browse and bid on junk removal jobs in your service areas
        </p>
      </div>

      {!hasServiceAreas && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 font-medium text-sm">
            You haven&apos;t set any service areas yet. Jobs are filtered by
            your service cities &mdash; without them you&apos;ll see all
            available jobs but may miss targeted notifications.
          </p>
          <a
            href="/provider/profile"
            className="text-amber-900 underline text-sm font-semibold mt-1 inline-block"
          >
            Update your profile &rarr;
          </a>
        </div>
      )}

      {filteredJobs.length > 0 ? (
        <div className="grid gap-6">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/provider/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {job.location_city}, {job.location_state}
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
          <p className="text-gray-600 mb-2">
            No jobs available{hasServiceAreas ? " in your service areas" : ""} yet.
          </p>
          <p className="text-sm text-gray-500">
            {hasServiceAreas
              ? "New jobs are posted regularly. Check back soon!"
              : "Set your service areas and junk types in your "}
            {!hasServiceAreas && (
              <a href="/provider/profile" className="text-green-600 hover:underline">
                profile
              </a>
            )}
            {!hasServiceAreas && " to see jobs in your cities."}
          </p>
        </Card>
      )}
    </div>
  );
}
