"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resolveDispute } from "@/actions/disputes";
import type { ResolutionType } from "@/lib/types";

const RESOLUTION_OPTIONS: { value: ResolutionType; label: string }[] = [
  { value: "customer_refund", label: "Customer Refund" },
  { value: "provider_payment", label: "Provider Payment" },
  { value: "split", label: "Split (50/50)" },
  { value: "dismissed", label: "Dismissed" },
  { value: "price_adjusted", label: "Price Adjusted" },
  { value: "partial_refund", label: "Partial Refund" },
  { value: "full_refund", label: "Full Refund" },
];

interface DisputeResolveFormProps {
  disputeId: string;
}

export function DisputeResolveForm({ disputeId }: DisputeResolveFormProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType | "">("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (!resolutionType) {
      setError("Please select a resolution type.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await resolveDispute(disputeId, resolutionType as ResolutionType, notes || undefined);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resolve dispute");
      }
    });
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 rounded-lg p-4 text-sm font-medium">
        Dispute resolved successfully.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Resolve this dispute</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resolution Type
        </label>
        <select
          value={resolutionType}
          onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          disabled={isPending}
        >
          <option value="">Select resolution type...</option>
          {RESOLUTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add resolution notes..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-[80px] resize-none"
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        loading={isPending}
        disabled={!resolutionType}
        size="sm"
      >
        Resolve Dispute
      </Button>
    </div>
  );
}
