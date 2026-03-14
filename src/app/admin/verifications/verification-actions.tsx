"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  reviewVerification,
  reviewProviderCategory,
  type VerificationCategory,
} from "@/actions/admin";

/* ------------------------------------------------------------------ */
/*  Legacy: single-document verification (kept for backward compat)    */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  New: Per-category verification (ID / Business / Insurance)         */
/* ------------------------------------------------------------------ */

interface CategoryActionsProps {
  providerId: string;
  category: VerificationCategory;
}

export function CategoryActions({ providerId, category }: CategoryActionsProps) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [rejectionNote, setRejectionNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);

  const categoryLabel =
    category === "id" ? "ID" : category === "business" ? "Business" : "Insurance";

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await reviewProviderCategory(providerId, category, true);
        setResult("approved");
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to approve ${categoryLabel}`);
      }
    });
  }

  function handleReject() {
    if (!rejectionNote.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await reviewProviderCategory(providerId, category, false, rejectionNote.trim());
        setResult("rejected");
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to reject ${categoryLabel}`);
      }
    });
  }

  if (result === "approved") {
    return (
      <div className="bg-green-50 text-green-800 rounded p-2 text-sm font-medium">
        {categoryLabel} approved.
      </div>
    );
  }
  if (result === "rejected") {
    return (
      <div className="bg-red-50 text-red-800 rounded p-2 text-sm font-medium">
        {categoryLabel} rejected.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 pt-3 space-y-2">
      {mode === "idle" ? (
        <div className="flex gap-2">
          <Button onClick={handleApprove} loading={isPending} size="sm">
            Approve {categoryLabel}
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
        <div className="space-y-2">
          <textarea
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            placeholder={`Reason for rejecting ${categoryLabel.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={handleReject}
              loading={isPending}
              disabled={!rejectionNote.trim()}
              size="sm"
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMode("idle");
                setRejectionNote("");
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
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
