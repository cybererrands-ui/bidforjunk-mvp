"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { confirmCompletion } from "@/actions/confirmations";

interface ConfirmButtonProps {
  jobId: string;
  userRole: "customer" | "provider";
  isConfirmed?: boolean;
}

export function ConfirmButton({ jobId, userRole, isConfirmed = false }: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await confirmCompletion(jobId, userRole);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isConfirmed) {
    return <Button variant="secondary" disabled>Confirmed</Button>;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Confirm Work Completed</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Completion">
        <div className="space-y-4">
          <p className="text-gray-600">
            By confirming completion, you&apos;re stating that the work has been completed
            satisfactorily. Both parties must confirm within 72 hours for payment release.
          </p>
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} loading={loading} className="flex-1">
              I Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
