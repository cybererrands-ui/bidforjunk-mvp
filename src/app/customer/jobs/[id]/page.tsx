import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, JUNK_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job || job.customer_id !== profile.id) {
    return <div className="text-center py-12">Job not found</div>;
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("job_id", job.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <div>
        <h1>{job.title}</h1>
        <p className="text-gray-600 mt-2">
          {job.location_city}, {job.location_state}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-2">{job.description}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Junk Types</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.junk_types.map((type: string) => (
                    <Badge key={type} variant="info">
                      {JUNK_TYPES[type as keyof typeof JUNK_TYPES]}
                    </Badge>
                  ))}
                </div>
              </div>

              {job.estimated_volume && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Volume</p>
                  <p className="mt-2">{job.estimated_volume}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="mt-2">{job.location_address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Posted</p>
                <p className="mt-2">{formatDate(job.created_at)}</p>
              </div>
            </div>
          </Card>

          {offers && offers.length > 0 && (
            <Card>
              <h2 className="font-semibold mb-4">Offers ({offers.length})</h2>
              <div className="space-y-4">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Provider</h3>
                      <Badge
                        variant={
                          offer.status === "accepted"
                            ? "success"
                            : offer.status === "rejected"
                              ? "danger"
                              : "default"
                        }
                      >
                        {offer.status}
                      </Badge>
                    </div>

                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(offer.price_cents)}
                    </p>

                    {offer.notes && (
                      <p className="text-gray-600 text-sm mb-2">
                        {offer.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {job.agreed_price_cents && (
          <Card>
            <h2 className="font-semibold mb-4">Agreement</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Agreed Price</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(job.agreed_price_cents)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold mt-2">
                  {JOB_STATUS_LABELS[job.status]}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
