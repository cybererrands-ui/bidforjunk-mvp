import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, JUNK_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrustBadges } from "@/components/providers/trust-badges";
import { Phone, Mail } from "lucide-react";
import {
  AcceptOfferButton,
  RejectOfferButton,
  CancelJobButton,
  ConfirmCompletionButton,
  CustomerChatThread,
} from "./job-actions";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile) redirect("/login");

  // Load job
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!job || job.customer_id !== profile.id) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-600">Job not found</p>
        <Link
          href="/customer/dashboard"
          className="btn-primary mt-4 inline-block"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Load offers with provider info (expanded for trust badges + contact release)
  const { data: offersRaw } = await supabase
    .from("offers")
    .select(
      `*, profiles!offers_provider_id_fkey(
        id, display_name, avg_rating, total_jobs_completed, is_verified,
        id_verified, business_verified, insurance_verified,
        same_day_available, disposal_practices, truck_size, junk_types,
        business_phone, business_email
      )`
    )
    .eq("job_id", job.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Normalize: Supabase may return joined profiles as array or object
  const offers = (offersRaw || []).map((o: any) => {
    const provRaw = o.profiles;
    const provider = Array.isArray(provRaw) ? provRaw[0] : provRaw;
    return { ...o, provider };
  });

  // Load confirmation
  const { data: confirmation } = await supabase
    .from("confirmations")
    .select("*")
    .eq("job_id", job.id)
    .is("deleted_at", null)
    .maybeSingle();

  const statusColor =
    JOB_STATUS_COLORS[job.status as keyof typeof JOB_STATUS_COLORS] ||
    "bg-gray-100 text-gray-800";

  const activeOffers = offers.filter((o: any) => o.status === "active");
  const acceptedOffer = offers.find((o: any) => o.status === "accepted");
  const canCancel = ["open", "negotiating"].includes(job.status);
  const canConfirm =
    ["completed"].includes(job.status) && !confirmation?.customer_confirmed;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/customer/jobs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        &larr; Back to My Jobs
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-gray-600 mt-1">
            {job.location_city}, {job.location_state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
          >
            {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ||
              job.status}
          </span>
          {canCancel && <CancelJobButton jobId={job.id} />}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content - left 2 cols */}
        <div className="md:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <h2 className="font-semibold text-lg mb-4">Job Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1">{job.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Junk Types
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(job.junk_types as string[]).map((type: string) => (
                      <Badge key={type} variant="info">
                        {JUNK_TYPES[type as keyof typeof JUNK_TYPES] || type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {job.estimated_volume && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Estimated Volume
                    </p>
                    <p className="mt-1">{job.estimated_volume}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">{job.location_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Posted</p>
                  <p className="mt-1">{formatDate(job.created_at)}</p>
                </div>
              </div>

              {job.budget_cents && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Budget</p>
                  <p className="mt-1 text-lg font-semibold text-green-700">
                    {formatCurrency(job.budget_cents)}
                  </p>
                </div>
              )}

              {job.preferred_time && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Preferred Time
                  </p>
                  <p className="mt-1">{job.preferred_time}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Photos */}
          {job.photos_urls && (job.photos_urls as string[]).length > 0 && (
            <Card>
              <h2 className="font-semibold text-lg mb-4">
                Photos ({(job.photos_urls as string[]).length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(job.photos_urls as string[]).map(
                  (url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Job photo ${i + 1}`}
                        className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )
                )}
              </div>
            </Card>
          )}

          {/* Offers */}
          <Card>
            <h2 className="font-semibold text-lg mb-4">
              Offers ({offers.length})
            </h2>

            {offers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">💰</p>
                <p>No offers yet. Providers will see your job and submit bids.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer: any) => {
                  const provider = offer.provider;
                  const isActive = offer.status === "active";
                  const isAccepted = offer.status === "accepted";

                  return (
                    <div
                      key={offer.id}
                      className={`border rounded-lg p-4 ${
                        isAccepted
                          ? "border-green-300 bg-green-50"
                          : offer.status === "rejected"
                            ? "border-gray-200 bg-gray-50 opacity-60"
                            : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            {(provider?.display_name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {provider?.display_name || "Provider"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {provider?.is_verified && (
                                <span className="text-green-600">
                                  ✓ Verified
                                </span>
                              )}
                              {provider?.total_jobs_completed > 0 && (
                                <span>
                                  {provider.total_jobs_completed} jobs
                                </span>
                              )}
                              {provider?.avg_rating && (
                                <span>
                                  ★ {Number(provider.avg_rating).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            isAccepted
                              ? "success"
                              : offer.status === "rejected"
                                ? "danger"
                                : "default"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>

                      {/* Trust badges */}
                      {provider && (
                        <div className="mb-3">
                          <TrustBadges
                            data={{
                              id_verified: provider.id_verified,
                              business_verified: provider.business_verified,
                              insurance_verified: provider.insurance_verified,
                              avg_rating: provider.avg_rating,
                              total_jobs_completed: provider.total_jobs_completed,
                              same_day_available: provider.same_day_available,
                              disposal_practices: provider.disposal_practices,
                              truck_size: provider.truck_size,
                              junk_types: provider.junk_types,
                            }}
                            maxBadges={4}
                          />
                        </div>
                      )}

                      <p className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(offer.price_cents)}
                      </p>

                      {offer.notes && (
                        <p className="text-gray-600 text-sm mb-3">
                          {offer.notes}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mb-3">
                        {offer.kind === "counter" ? "Counter-offer" : "Bid"} &middot;{" "}
                        {formatDate(offer.created_at)}
                      </p>

                      {/* Accept/Reject buttons */}
                      {isActive &&
                        ["open", "negotiating"].includes(job.status) && (
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <AcceptOfferButton offerId={offer.id} />
                            <RejectOfferButton offerId={offer.id} />
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Chat / Messages thread */}
          <CustomerChatThread jobId={job.id} profileId={profile.id} />
        </div>

        {/* Sidebar - right col */}
        <div className="space-y-6">
          {/* Price Summary */}
          {job.agreed_price_cents && (
            <Card>
              <h2 className="font-semibold mb-4">Agreement</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Agreed Price</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {formatCurrency(job.agreed_price_cents)}
                  </p>
                </div>
                {acceptedOffer?.provider?.display_name && (
                  <div>
                    <p className="text-sm text-gray-500">Provider</p>
                    <p className="font-medium mt-1">
                      {acceptedOffer.provider.display_name}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
                  >
                    {JOB_STATUS_LABELS[
                      job.status as keyof typeof JOB_STATUS_LABELS
                    ] || job.status}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Contact Info — released after offer accepted */}
          {job.contact_released_at && acceptedOffer?.provider && (
            <Card>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                Provider Contact
              </h2>
              <div className="space-y-3 text-sm">
                <p className="font-medium">
                  {acceptedOffer.provider.display_name}
                </p>
                {acceptedOffer.provider.business_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a
                      href={`tel:${acceptedOffer.provider.business_phone}`}
                      className="text-green-700 hover:underline"
                    >
                      {acceptedOffer.provider.business_phone}
                    </a>
                  </div>
                )}
                {acceptedOffer.provider.business_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <a
                      href={`mailto:${acceptedOffer.provider.business_email}`}
                      className="text-green-700 hover:underline"
                    >
                      {acceptedOffer.provider.business_email}
                    </a>
                  </div>
                )}
                {!acceptedOffer.provider.business_phone &&
                  !acceptedOffer.provider.business_email && (
                    <p className="text-gray-500 italic">
                      Provider has not added contact details yet. Use the
                      chat to coordinate.
                    </p>
                  )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Contact info released{" "}
                {formatDate(job.contact_released_at)}
              </p>
            </Card>
          )}

          {/* Confirmation */}
          {canConfirm && (
            <Card>
              <h2 className="font-semibold mb-4">Confirm Completion</h2>
              <p className="text-sm text-gray-600 mb-4">
                The provider has marked this job as complete. Please confirm if
                the work was done satisfactorily.
              </p>
              <ConfirmCompletionButton
                jobId={job.id}
                confirmationId={confirmation?.id}
              />
            </Card>
          )}

          {/* Confirmation Status */}
          {confirmation?.customer_confirmed && (
            <Card>
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✓</span>
                <p className="font-medium">You confirmed completion</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {confirmation.customer_confirmed_at ? formatDate(confirmation.customer_confirmed_at) : ""}
              </p>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Offers</span>
                <span className="font-medium">{offers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Offers</span>
                <span className="font-medium">{activeOffers.length}</span>
              </div>
              {offers.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lowest Bid</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        Math.min(...offers.map((o: any) => o.price_cents))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Highest Bid</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.max(...offers.map((o: any) => o.price_cents))
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
