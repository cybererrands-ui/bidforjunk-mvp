"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, JUNK_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, Package, DollarSign, User, CheckCircle, XCircle, AlertTriangle, Image as ImageIcon } from "lucide-react";

interface JobDetailPageProps {
  params: { id: string };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [job, setJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [escrow, setEscrow] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!prof) { router.push("/login"); return; }
      setProfile(prof);

      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", params.id)
        .single();
      if (!jobData || jobData.customer_id !== prof.id) {
        setError("Job not found");
        setLoading(false);
        return;
      }
      setJob(jobData);

      // Load offers with provider info
      const { data: offersData } = await supabase
        .from("offers")
        .select("*, provider:profiles!offers_provider_id_fkey(display_name, avg_rating, total_jobs_completed, is_verified)")
        .eq("job_id", jobData.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setOffers(offersData || []);

      // Load escrow
      const { data: escrowData } = await supabase
        .from("escrow_payments")
        .select("*")
        .eq("job_id", jobData.id)
        .maybeSingle();
      setEscrow(escrowData);

      // Load confirmation
      const { data: confData } = await supabase
        .from("confirmations")
        .select("*")
        .eq("job_id", jobData.id)
        .maybeSingle();
      setConfirmation(confData);
    } catch (err: any) {
      setError(err.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptOffer(offerId: string) {
    setActionLoading(offerId);
    setError(null);
    try {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) throw new Error("Offer not found");

      // Accept this offer
      await supabase
        .from("offers")
        .update({ status: "accepted", kind: "accept" })
        .eq("id", offerId);

      // Lock the job
      await supabase
        .from("jobs")
        .update({
          status: "locked",
          agreed_price_cents: offer.price_cents,
          final_offer_id: offerId,
        })
        .eq("id", job.id);

      // Reject other offers
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("job_id", job.id)
        .neq("id", offerId);

      setSuccessMsg("Offer accepted! The job is now locked.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to accept offer");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectOffer(offerId: string) {
    setActionLoading(offerId);
    setError(null);
    try {
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offerId);

      setSuccessMsg("Offer rejected.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to reject offer");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelJob() {
    if (!confirm("Are you sure you want to cancel this job?")) return;
    setActionLoading("cancel");
    setError(null);
    try {
      await supabase
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", job.id);

      setSuccessMsg("Job cancelled.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmCompletion() {
    setActionLoading("confirm");
    setError(null);
    try {
      if (confirmation) {
        await supabase
          .from("confirmations")
          .update({ customer_confirmed: true, customer_confirmed_at: new Date().toISOString() })
          .eq("id", confirmation.id);
      } else {
        await supabase
          .from("confirmations")
          .insert({
            job_id: job.id,
            customer_confirmed: true,
            customer_confirmed_at: new Date().toISOString(),
            deadline_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          });
      }

      setSuccessMsg("You've confirmed the job is complete!");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to confirm");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-600">{error || "Job not found"}</p>
        <Link href="/customer/dashboard" className="btn-primary mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    negotiating: "bg-yellow-100 text-yellow-800",
    locked: "bg-purple-100 text-purple-800",
    dispatched: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    released: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    disputed: "bg-red-100 text-red-800",
  };

  const activeOffers = offers.filter((o) => o.status === "active");
  const acceptedOffer = offers.find((o) => o.status === "accepted");
  const canCancel = ["open", "negotiating"].includes(job.status);
  const canConfirm = ["completed"].includes(job.status) && !confirmation?.customer_confirmed;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/customer/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="flex items-center gap-2 text-gray-600 mt-1">
            <MapPin className="w-4 h-4" />
            {job.location_city}, {job.location_state}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[job.status as string] || "bg-gray-100 text-gray-800"}`}>
            {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] || job.status}
          </span>
          {canCancel && (
            <button
              onClick={handleCancelJob}
              disabled={actionLoading === "cancel"}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              {actionLoading === "cancel" ? "Cancelling..." : "Cancel Job"}
            </button>
          )}
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
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Junk Types
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.junk_types.map((type: string) => (
                      <Badge key={type} variant="info">
                        {JUNK_TYPES[type as keyof typeof JUNK_TYPES] || type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {job.estimated_volume && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estimated Volume</p>
                    <p className="mt-1">{job.estimated_volume}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Address
                  </p>
                  <p className="mt-1">{job.location_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Posted
                  </p>
                  <p className="mt-1">{formatDate(job.created_at)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Photos */}
          {job.photos_urls && job.photos_urls.length > 0 && (
            <Card>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Photos ({job.photos_urls.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {job.photos_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Job photo ${i + 1}`}
                      className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Offers */}
          <Card>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Offers ({offers.length})
            </h2>

            {offers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No offers yet. Providers will see your job and submit bids.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => {
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
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {provider?.display_name || "Provider"}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {provider?.is_verified && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                              )}
                              {provider?.total_jobs_completed > 0 && (
                                <span>{provider.total_jobs_completed} jobs done</span>
                              )}
                              {provider?.avg_rating && (
                                <span>★ {Number(provider.avg_rating).toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            isAccepted ? "success" : offer.status === "rejected" ? "danger" : "default"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>

                      <p className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(offer.price_cents)}
                      </p>

                      {offer.notes && (
                        <p className="text-gray-600 text-sm mb-3">{offer.notes}</p>
                      )}

                      <p className="text-xs text-gray-400 mb-3">
                        {formatDate(offer.created_at)}
                      </p>

                      {/* Accept/Reject buttons */}
                      {isActive && ["open", "negotiating"].includes(job.status) && (
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {actionLoading === offer.id ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer.id)}
                            disabled={actionLoading === offer.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
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
                    <p className="font-medium mt-1">{acceptedOffer.provider.display_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${statusColor[job.status as string]}`}>
                    {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS]}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Escrow Status */}
          {escrow && (
            <Card>
              <h2 className="font-semibold mb-4">Escrow Payment</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(escrow.amount_cents)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={escrow.status === "succeeded" ? "success" : "default"}>
                    {escrow.status}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Confirmation */}
          {canConfirm && (
            <Card>
              <h2 className="font-semibold mb-4">Confirm Completion</h2>
              <p className="text-sm text-gray-600 mb-4">
                The provider has marked this job as complete. Please confirm if the work was done satisfactorily.
              </p>
              <button
                onClick={handleConfirmCompletion}
                disabled={actionLoading === "confirm"}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading === "confirm" ? "Confirming..." : "Confirm Job Complete"}
              </button>
            </Card>
          )}

          {/* Confirmation Status */}
          {confirmation?.customer_confirmed && (
            <Card>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">You confirmed completion</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(confirmation.customer_confirmed_at)}
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
                      {formatCurrency(Math.min(...offers.map((o) => o.price_cents)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Highest Bid</span>
                    <span className="font-medium">
                      {formatCurrency(Math.max(...offers.map((o) => o.price_cents)))}
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
