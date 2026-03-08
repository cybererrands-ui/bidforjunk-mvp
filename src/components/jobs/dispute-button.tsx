"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { openDispute } from "@/actions/disputes";

interface DisputeButtonProps {
  jobId: string;
}

export function DisputeButton({ jobId }: DisputeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenDispute = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!reason.trim()) throw new Error("Please provide a reason");
      await openDispute(jobId, reason);
      setIsOpen(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>Open Dispute</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Open a Dispute">
        <div className="space-y-4">
          <p className="text-gray-600">
            If there&apos;s an issue with this job, you can open a dispute for resolution.
          </p>
          <Textarea
            label="Reason for Dispute"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what went wrong..."
            required
          />
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleOpenDispute} loading={loading} variant="danger" className="flex-1">
              Open Dispute
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
