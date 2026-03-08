"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reviewVerification } from "@/actions/admin";

interface VerificationActionsProps {
  verificationId: string;
}

export function VerificationActions({ verificationId }: VerificationActionsProps) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await reviewVerification(verificationId, true);
        setResult("approved");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve verification");
      }
    });
  }

  function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await reviewVerification(verificationId, false, rejectionReason.trim());
        setResult("rejected");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject verification");
      }
    });
  }

  if (result === "approved") {
    return (
      <div className="bg-green-50 text-green-800 rounded-lg p-3 text-sm font-medium">
        Verification approved successfully.
      </div>
    );
  }

  if (result === "rejected") {
    return (
      <div className="bg-red-50 text-red-800 rounded-lg p-3 text-sm font-medium">
        Verification rejected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === "idle" ? (
        <div className="flex gap-3">
          <Button onClick={handleApprove} loading={isPending} size="sm">
            Approve
          </Button>
          <Button
            variant="danger"
            onClick={() => setMode("rejecting")}
            disabled={isPending}
            size="sm"
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-[80px] resize-none"
              disabled={isPending}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleReject}
              loading={isPending}
              disabled={!rejectionReason.trim()}
              size="sm"
            >
              Confirm Rejection
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMode("idle");
                setRejectionReason("");
                setError(null);
              }}
              disabled={isPending}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
