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

  const { data: profile } = await supabase
    .from("profiles")
    .select("service_areas, junk_types")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (profile?.service_areas && profile.service_areas.length > 0) {
    query = query.in(
      "location_city_slug",
      profile.service_areas.map((c: string) =>
        c.toLowerCase().replace(/\s+/g, "-")
      )
    );
  }

  const { data: jobs } = await query;

  const filteredJobs = jobs?.filter((job) => {
    if (!profile?.junk_types || profile.junk_types.length === 0) return true;
    return job.junk_types.some((type: string) =>
      (profile.junk_types as string[]).includes(type)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1>Available Jobs</h1>
        <p className="text-gray-600 mt-2">
          Browse and bid on junk removal jobs in your service areas
        </p>
      </div>

      {filteredJobs && filteredJobs.length > 0 ? (
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
            No jobs available in your service areas yet.
          </p>
          <p className="text-sm text-gray-500">
            New jobs in Hamilton are posted daily. Check back soon or make sure
            your service areas and junk types are set in your{" "}
            <a href="/provider/profile" className="text-green-600 hover:underline">
              profile
            </a>.
          </p>
        </Card>
      )}
    </div>
  );
}
