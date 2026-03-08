import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { VerificationActions } from "./verification-actions";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();

  // Fetch all verifications with provider profile info
  const { data: verifications } = await supabase
    .from("provider_verifications")
    .select("*, profiles!provider_verifications_provider_id_fkey(id, display_name, email, avatar_url)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Group by status
  const pendingVerifications = verifications?.filter((v) => v.status === "pending") || [];
  const approvedVerifications = verifications?.filter((v) => v.status === "approved") || [];
  const rejectedVerifications = verifications?.filter((v) => v.status === "rejected") || [];

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  function isImageUrl(url: string): boolean {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  }

  function renderVerificationCard(
    verification: NonNullable<typeof verifications>[number],
    showActions: boolean
  ) {
    const providerRaw = verification.profiles as any;
    const provider = Array.isArray(providerRaw) ? providerRaw[0] : providerRaw;

    return (
      <Card key={verification.id}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {provider?.display_name || `Provider ${verification.provider_id.slice(0, 8)}`}
            </h3>
            {provider?.email && (
              <p className="text-sm text-gray-500">{provider.email}</p>
            )}
          </div>
          <Badge variant={statusBadgeVariant(verification.status)}>
            {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
          </Badge>
        </div>

        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <p>
            <span className="font-medium text-gray-700">Submitted:</span>{" "}
            {formatDate(verification.created_at)}
          </p>
          {verification.verified_at && (
            <p>
              <span className="font-medium text-gray-700">
                {verification.status === "approved" ? "Approved:" : "Reviewed:"}
              </span>{" "}
              {formatDate(verification.verified_at)}
            </p>
          )}
        </div>

        {/* Document Viewer */}
        {verification.document_url && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Document</p>
            {isImageUrl(verification.document_url) ? (
              <a
                href={verification.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-sm border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={verification.document_url}
                  alt="Verification document"
                  className="w-full h-auto max-h-64 object-contain bg-gray-50"
                />
                <p className="text-xs text-center text-gray-500 py-2 border-t border-gray-100">
                  Click to view full size
                </p>
              </a>
            ) : (
              <a
                href={verification.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                View Document
              </a>
            )}
          </div>
        )}

        {/* Rejection reason */}
        {verification.status === "rejected" && verification.rejection_reason && (
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-700 mt-1">{verification.rejection_reason}</p>
          </div>
        )}

        {/* Approve / Reject actions */}
        {showActions && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <VerificationActions verificationId={verification.id} />
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Provider Verifications</h1>
        <p className="text-gray-600 mt-2">
          Review and approve provider background checks
        </p>
      </div>

      {/* Pending */}
      {pendingVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Pending Review ({pendingVerifications.length})
          </h2>
          <div className="grid gap-6">
            {pendingVerifications.map((v) => renderVerificationCard(v, true))}
          </div>
        </div>
      )}

      {/* Approved */}
      {approvedVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Approved ({approvedVerifications.length})
          </h2>
          <div className="grid gap-6">
            {approvedVerifications.map((v) => renderVerificationCard(v, false))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejectedVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Rejected ({rejectedVerifications.length})
          </h2>
          <div className="grid gap-6">
            {rejectedVerifications.map((v) => renderVerificationCard(v, false))}
          </div>
        </div>
      )}

      {(!verifications || verifications.length === 0) && (
        <Card className="text-center py-12">
          <p className="text-gray-600">No verifications found</p>
        </Card>
      )}
    </div>
  );
}
