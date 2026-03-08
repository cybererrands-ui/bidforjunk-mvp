"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createEscrowPayment } from "@/actions/escrow";
import { formatCurrency } from "@/lib/utils";

interface EscrowPayButtonProps {
  jobId: string;
  customerId: string;
  providerId: string;
  amount: number;
}

export function EscrowPayButton({ jobId, customerId, providerId, amount }: EscrowPayButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      await createEscrowPayment(jobId, customerId, providerId, amount);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Pay {formatCurrency(amount)} to Escrow</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Escrow Payment">
        <div className="space-y-4">
          <p className="text-gray-600">
            This amount will be held securely until the work is completed and confirmed by both parties.
          </p>
          <div className="p-4 bg-brand-50 rounded-lg">
            <p className="text-sm text-gray-600">Amount to pay</p>
            <p className="text-2xl font-bold text-brand-600">{formatCurrency(amount)}</p>
          </div>
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePay} loading={loading} className="flex-1">
              Proceed to Payment
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
