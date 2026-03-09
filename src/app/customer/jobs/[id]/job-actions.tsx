"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptOffer } from "@/actions/offers";
import { cancelJob } from "@/actions/jobs";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

// Accept Offer Button
export function AcceptOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      await acceptOffer(offerId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to accept offer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Accepting..." : "Accept Offer"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Reject Offer Button
export function RejectOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offerId);
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
    >
      <XCircle className="w-4 h-4" />
      {loading ? "Rejecting..." : "Reject"}
    </button>
  );
}

// Cancel Job Button
export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this job?")) return;
    setLoading(true);
    setError(null);
    try {
      await cancelJob(jobId);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Job"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

// Confirm Completion Button
export function ConfirmCompletionButton({
  jobId,
  confirmationId,
}: {
  jobId: string;
  confirmationId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      if (confirmationId) {
        await supabase
          .from("confirmations")
          .update({
            customer_confirmed: true,
            customer_confirmed_at: new Date().toISOString(),
          })
          .eq("id", confirmationId);
      } else {
        await supabase.from("confirmations").insert({
          job_id: jobId,
          customer_confirmed: true,
          customer_confirmed_at: new Date().toISOString(),
          deadline_at: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
        });
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to confirm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Confirming..." : "Confirm Job Complete"}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
