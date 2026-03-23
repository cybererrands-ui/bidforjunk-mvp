"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { ServiceAgreement } from "@/components/jobs/service-agreement";
import { acceptOffer } from "@/actions/offers";
import { CheckCircle } from "lucide-react";

interface AcceptOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  offerPriceCents: number;
  providerName: string;
  customerName: string;
  jobTitle: string;
  jobDescription: string;
  jobCity: string;
  jobState: string;
  junkTypes: string[];
}

export function AcceptOfferModal({
  isOpen,
  onClose,
  offerId,
  offerPriceCents,
  providerName,
  customerName,
  jobTitle,
  jobDescription,
  jobCity,
  jobState,
  junkTypes,
}: AcceptOfferModalProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    try {
      await acceptOffer(offerId);
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to accept offer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return; // Prevent closing during submission
    setAgreed(false);
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Service Agreement" size="xl">
      {/* Scrollable agreement content */}
      <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
        <ServiceAgreement
          customerName={customerName}
          providerName={providerName}
          jobTitle={jobTitle}
          jobDescription={jobDescription}
          jobCity={jobCity}
          jobState={jobState}
          junkTypes={junkTypes}
          agreedPriceCents={offerPriceCents}
          agreementDate={new Date().toISOString()}
          compact={false}
        />
      </div>

      {/* Agreement checkbox + action buttons */}
      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            disabled={loading}
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            I have read and understand this non-binding service agreement.
            I agree to share my contact details with the provider.
          </span>
        </label>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={!agreed || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? "Processing..." : "Accept & Share Contact Info"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
