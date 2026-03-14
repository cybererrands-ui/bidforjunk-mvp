import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getProvidersForVerification } from "@/actions/admin";
import { CategoryActions } from "./verification-actions";
import {
  Shield,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */

function statusBadge(verified: boolean | null, rejectionNote: string | null) {
  if (verified === true)
    return <Badge variant="success">Approved</Badge>;
  if (rejectionNote)
    return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function StatusIcon({ verified, rejectionNote }: { verified: boolean | null; rejectionNote: string | null }) {
  if (verified === true)
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  if (rejectionNote)
    return <XCircle className="h-5 w-5 text-red-500" />;
  return <Clock className="h-5 w-5 text-amber-500" />;
}

function isImageUrl(url: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
}

function DocViewer({ url, label }: { url: string; label: string }) {
  if (!url) return <p className="text-sm text-gray-400 italic">No document uploaded</p>;

  if (isImageUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-xs border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="w-full h-auto max-h-48 object-contain bg-gray-50" />
        <p className="text-xs text-center text-gray-500 py-1.5 border-t border-gray-100">
          Click to view full size
        </p>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
    >
      <FileText className="w-4 h-4 text-gray-400" />
      View {label}
    </a>
  );
}

function InsuranceExpiryWarning({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return (
      <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        Expired {Math.abs(daysUntil)} days ago
      </div>
    );
  }
  if (daysUntil <= 30) {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        Expires in {daysUntil} days
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                                */
/* ------------------------------------------------------------------ */

export default async function AdminVerificationsPage() {
  const providers = await getProvidersForVerification();

  // Categorize providers
  const needsReview = providers.filter(
    (p: any) =>
      (p.id_document_url || p.legal_full_name || p.legal_business_name || p.insurer_name) &&
      (!p.id_verified || !p.business_verified || !p.insurance_verified)
  );
  const fullyVerified = providers.filter(
    (p: any) => p.id_verified && p.business_verified && p.insurance_verified
  );
  const insuranceExpiring = providers.filter((p: any) => {
    if (!p.insurance_expiry_date) return false;
    const daysUntil = Math.ceil(
      (new Date(p.insurance_expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30 && daysUntil >= 0 && p.insurance_verified;
  });
  const insuranceExpired = providers.filter((p: any) => p.insurance_expired === true);

  function renderProviderCard(provider: any) {
    return (
      <Card key={provider.id} className="space-y-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="font-semibold text-lg">
              {provider.display_name || "Unnamed Provider"}
            </h3>
            <p className="text-sm text-gray-500">{provider.email}</p>
            {provider.phone_number && (
              <p className="text-sm text-gray-500">{provider.phone_number}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Joined {formatDate(provider.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {provider.is_verified ? (
              <Badge variant="success">Fully Verified</Badge>
            ) : (
              <Badge variant="warning">Incomplete</Badge>
            )}
            {provider.subscription_tier && provider.subscription_tier !== "free" && (
              <Badge variant="info">
                {provider.subscription_tier.charAt(0).toUpperCase() +
                  provider.subscription_tier.slice(1)}
              </Badge>
            )}
            {provider.is_suspended && <Badge variant="danger">Suspended</Badge>}
          </div>
        </div>

        {/* ── Identity Section ────────────────────────── */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Identity Verification</h4>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon verified={provider.id_verified} rejectionNote={provider.id_rejection_note} />
              {statusBadge(provider.id_verified, provider.id_rejection_note)}
            </div>
          </div>

          {provider.legal_full_name ? (
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><span className="font-medium">Name:</span> {provider.legal_full_name}</p>
              {provider.date_of_birth && (
                <p><span className="font-medium">DOB:</span> {provider.date_of_birth}</p>
              )}
              {provider.id_type && (
                <p><span className="font-medium">ID Type:</span> {provider.id_type}</p>
              )}
              {provider.id_expiry_date && (
                <p><span className="font-medium">ID Expiry:</span> {provider.id_expiry_date}</p>
              )}
              {provider.id_document_url && (
                <DocViewer url={provider.id_document_url} label="ID Document" />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-3">No identity documents submitted</p>
          )}

          {provider.id_rejection_note && (
            <div className="bg-red-50 rounded p-2 mb-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Rejection:</span> {provider.id_rejection_note}
              </p>
            </div>
          )}

          {!provider.id_verified && provider.legal_full_name && (
            <CategoryActions providerId={provider.id} category="id" />
          )}
        </div>

        {/* ── Business Section ────────────────────────── */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Business Registration</h4>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon verified={provider.business_verified} rejectionNote={provider.business_rejection_note} />
              {statusBadge(provider.business_verified, provider.business_rejection_note)}
            </div>
          </div>

          {provider.legal_business_name ? (
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><span className="font-medium">Legal Name:</span> {provider.legal_business_name}</p>
              {provider.operating_name && (
                <p><span className="font-medium">Operating As:</span> {provider.operating_name}</p>
              )}
              {provider.business_registration_number && (
                <p><span className="font-medium">Reg #:</span> {provider.business_registration_number}</p>
              )}
              {provider.province_of_registration && (
                <p><span className="font-medium">Province:</span> {provider.province_of_registration}</p>
              )}
              {provider.business_type && (
                <p><span className="font-medium">Type:</span> {provider.business_type}</p>
              )}
              {provider.business_address && (
                <p><span className="font-medium">Address:</span> {provider.business_address}</p>
              )}
              {provider.business_phone && (
                <p><span className="font-medium">Phone:</span> {provider.business_phone}</p>
              )}
              {provider.business_email && (
                <p><span className="font-medium">Email:</span> {provider.business_email}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-3">No business details submitted</p>
          )}

          {provider.business_rejection_note && (
            <div className="bg-red-50 rounded p-2 mb-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Rejection:</span> {provider.business_rejection_note}
              </p>
            </div>
          )}

          {!provider.business_verified && provider.legal_business_name && (
            <CategoryActions providerId={provider.id} category="business" />
          )}
        </div>

        {/* ── Insurance Section ────────────────────────── */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Insurance</h4>
            </div>
            <div className="flex items-center gap-2">
              {provider.insurance_expired && (
                <Badge variant="danger">Expired</Badge>
              )}
              <StatusIcon verified={provider.insurance_verified} rejectionNote={provider.insurance_rejection_note} />
              {statusBadge(provider.insurance_verified, provider.insurance_rejection_note)}
            </div>
          </div>

          {provider.insurer_name ? (
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><span className="font-medium">Insurer:</span> {provider.insurer_name}</p>
              {provider.insurance_policy_number && (
                <p><span className="font-medium">Policy #:</span> {provider.insurance_policy_number}</p>
              )}
              {provider.insurance_coverage_type && (
                <p><span className="font-medium">Coverage:</span> {provider.insurance_coverage_type}</p>
              )}
              {provider.insurance_coverage_amount && (
                <p><span className="font-medium">Amount:</span> ${(provider.insurance_coverage_amount / 100).toLocaleString()}</p>
              )}
              {provider.insurance_effective_date && (
                <p><span className="font-medium">Effective:</span> {provider.insurance_effective_date}</p>
              )}
              {provider.insurance_expiry_date && (
                <p><span className="font-medium">Expiry:</span> {provider.insurance_expiry_date}</p>
              )}
              <InsuranceExpiryWarning expiryDate={provider.insurance_expiry_date} />
              {provider.insurance_certificate_url && (
                <DocViewer url={provider.insurance_certificate_url} label="Insurance Certificate" />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-3">No insurance details submitted</p>
          )}

          {provider.insurance_rejection_note && (
            <div className="bg-red-50 rounded p-2 mb-3">
              <p className="text-sm text-red-700">
                <span className="font-medium">Rejection:</span> {provider.insurance_rejection_note}
              </p>
            </div>
          )}

          {!provider.insurance_verified && provider.insurer_name && (
            <CategoryActions providerId={provider.id} category="insurance" />
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Provider Verifications</h1>
        <p className="text-gray-600 mt-2">
          Review identity, business, and insurance documents for each provider
        </p>
      </div>

      {/* Alert: Insurance expiring soon */}
      {insuranceExpiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {insuranceExpiring.length} provider{insuranceExpiring.length > 1 ? "s" : ""} with insurance expiring within 30 days
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {insuranceExpiring.map((p: any) => p.display_name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Alert: Insurance expired */}
      {insuranceExpired.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {insuranceExpired.length} provider{insuranceExpired.length > 1 ? "s" : ""} with expired insurance (hidden from marketplace)
            </p>
            <p className="text-sm text-red-700 mt-1">
              {insuranceExpired.map((p: any) => p.display_name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Needs Review */}
      {needsReview.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Needs Review ({needsReview.length})
          </h2>
          <div className="grid gap-6">
            {needsReview.map((p: any) => renderProviderCard(p))}
          </div>
        </div>
      )}

      {/* Fully Verified */}
      {fullyVerified.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Fully Verified ({fullyVerified.length})
          </h2>
          <div className="grid gap-6">
            {fullyVerified.map((p: any) => renderProviderCard(p))}
          </div>
        </div>
      )}

      {providers.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">No provider applications yet</p>
        </Card>
      )}
    </div>
  );
}
