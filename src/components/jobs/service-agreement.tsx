import { formatCurrency } from "@/lib/utils";
import { JUNK_TYPES } from "@/lib/constants";
import { AGREEMENT_TERMS, formatJunkTypes } from "@/lib/agreement-text";
import type { JunkType } from "@/lib/types";

interface ServiceAgreementProps {
  customerName: string;
  providerName: string;
  jobTitle: string;
  jobDescription: string;
  jobCity: string;
  jobState: string;
  junkTypes: string[];
  agreedPriceCents: number;
  agreementDate: string;
  /** compact=true shows condensed version for sidebar; false shows full version for modal */
  compact?: boolean;
}

export function ServiceAgreement({
  customerName,
  providerName,
  jobTitle,
  jobDescription,
  jobCity,
  jobState,
  junkTypes,
  agreedPriceCents,
  agreementDate,
  compact = false,
}: ServiceAgreementProps) {
  const location =
    [jobCity, jobState].filter(Boolean).join(", ") || "Not specified";
  const formattedDate = new Date(agreementDate).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (compact) {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Service Agreement
          </span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>
        <div className="space-y-1">
          <p>
            <span className="text-gray-500">Customer:</span>{" "}
            <span className="font-medium">{customerName}</span>
          </p>
          <p>
            <span className="text-gray-500">Provider:</span>{" "}
            <span className="font-medium">{providerName}</span>
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Estimated Price</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(agreedPriceCents)}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            ⚠ Price subject to adjustment after on-site inspection.
            Either party may cancel before work begins.
          </p>
        </div>
      </div>
    );
  }

  // Full agreement (for modal)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-green-200 pb-4">
        <h2 className="text-xl font-bold text-green-700">
          BidForJunk Service Agreement
        </h2>
        <p className="text-sm text-gray-500 mt-1">Date: {formattedDate}</p>
      </div>

      {/* Parties */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Parties
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
          <p>
            <span className="text-gray-500">Customer:</span>{" "}
            <span className="font-medium">{customerName}</span>
          </p>
          <p>
            <span className="text-gray-500">Service Provider:</span>{" "}
            <span className="font-medium">{providerName}</span>
          </p>
        </div>
      </div>

      {/* Job Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Job Details
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <p className="font-medium">{jobTitle}</p>
          <p>
            <span className="text-gray-500">Location:</span> {location}
          </p>
          <p>
            <span className="text-gray-500">Junk Types:</span>{" "}
            {formatJunkTypes(junkTypes)}
          </p>
          {jobDescription && (
            <p className="text-gray-600 text-xs mt-1">{jobDescription}</p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500 mb-1">Estimated Price</p>
        <p className="text-3xl font-bold text-green-600">
          {formatCurrency(agreedPriceCents)} <span className="text-lg font-normal">CAD</span>
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>⚠ IMPORTANT:</strong> This price is an estimate based on
          photos and description provided by the Customer. The final price is{" "}
          <strong>SUBJECT TO ADJUSTMENT</strong> following the Provider&apos;s
          on-site inspection of the items. If the scope of work differs
          materially from what was described, the Provider may propose an
          adjusted price before beginning work. The Customer may accept the
          adjusted price or cancel at no charge.
        </p>
      </div>

      {/* Terms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Terms
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 leading-relaxed">
          {AGREEMENT_TERMS.map((term, i) => (
            <li key={i} className="pl-1">
              {term}
            </li>
          ))}
        </ol>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-400 text-center">
          This is a non-binding service agreement generated by BidForJunk.
        </p>
      </div>
    </div>
  );
}
