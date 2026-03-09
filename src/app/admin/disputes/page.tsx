import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DisputeResolveForm } from "./dispute-resolve-form";
import { ResolutionType } from "@/lib/types";

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  // Fetch all disputes with job info and opened_by profile
  const { data: disputes } = await supabase
    .from("disputes")
    .select("*, jobs(id, title, status, agreed_price_cents), profiles!disputes_opened_by_id_fkey(id, display_name, email, role)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch dispute evidence for all disputes
  const disputeIds = disputes?.map((d) => d.id) || [];
  const { data: allEvidence } = disputeIds.length > 0
    ? await supabase
        .from("dispute_evidence")
        .select("*, profiles!dispute_evidence_uploaded_by_id_fkey(display_name)")
        .in("dispute_id", disputeIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Group evidence by dispute_id
  const evidenceByDispute: Record<string, any[]> = {};
  (allEvidence as any[] || []).forEach((ev: any) => {
    if (!evidenceByDispute[ev.dispute_id]) {
      evidenceByDispute[ev.dispute_id] = [];
    }
    evidenceByDispute[ev.dispute_id]!.push(ev);
  });

  // Separate open vs resolved/cancelled disputes
  const openDisputes = disputes?.filter((d) => d.status === "open") || [];
  const resolvedDisputes = disputes?.filter((d) => d.status !== "open") || [];

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "danger";
      case "resolved":
        return "success";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const resolutionLabel = (type: string | null) => {
    if (!type) return null;
    const labels: Record<string, string> = {
      customer_refund: "Customer Refund",
      provider_payment: "Provider Payment",
      split: "Split",
      dismissed: "Dismissed",
      price_adjusted: "Price Adjusted",
      partial_refund: "Partial Refund",
      full_refund: "Full Refund",
    };
    return labels[type] || type;
  };

  function isImageFile(fileType: string | null): boolean {
    if (!fileType) return false;
    return fileType.startsWith("image/");
  }

  function renderDisputeCard(dispute: NonNullable<typeof disputes>[number]) {
    const jobRaw = dispute.jobs as any;
    const job = Array.isArray(jobRaw) ? jobRaw[0] : jobRaw;
    const openedByRaw = dispute.profiles as any;
    const openedBy = Array.isArray(openedByRaw) ? openedByRaw[0] : openedByRaw;
    const evidence = evidenceByDispute[dispute.id] || [];

    return (
      <Card key={dispute.id}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {job?.title || `Job ${dispute.job_id.slice(0, 8)}`}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Opened by{" "}
              <span className="font-medium text-gray-700">
                {openedBy?.display_name || "Unknown"}
              </span>
              {openedBy?.email && (
                <span className="text-gray-400"> ({openedBy.email})</span>
              )}
            </p>
          </div>
          <Badge variant={statusBadgeVariant(dispute.status)}>
            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
          </Badge>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-sm">
            {dispute.reason}
          </p>
        </div>

        {/* Resolution info (for resolved disputes) */}
        {dispute.resolution_type && (
          <div className="mb-4 bg-green-50 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800 mb-1">
              Resolution: {resolutionLabel(dispute.resolution_type)}
            </p>
            {dispute.notes && (
              <p className="text-sm text-green-700">{dispute.notes}</p>
            )}
          </div>
        )}

        {/* Evidence Viewer */}
        {evidence.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Evidence ({evidence.length} file{evidence.length !== 1 ? "s" : ""})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {evidence.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {isImageFile(ev.file_type) ? (
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.file_url}
                        alt={ev.description || "Evidence"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 flex flex-col items-center justify-center p-3">
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
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
                      <span className="text-xs text-gray-500 text-center truncate w-full">
                        {ev.file_type || "File"}
                      </span>
                    </div>
                  )}
                  {ev.description && (
                    <p className="text-xs text-gray-500 p-2 truncate border-t border-gray-100">
                      {ev.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Form (for open disputes only) */}
        {dispute.status === "open" && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <DisputeResolveForm disputeId={dispute.id} />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm text-gray-500 mt-4">
          <span>Opened {formatDate(dispute.created_at)}</span>
          {dispute.updated_at !== dispute.created_at && (
            <span>Updated {formatDate(dispute.updated_at)}</span>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dispute Management</h1>
        <p className="text-gray-600 mt-2">
          Review and resolve customer disputes
        </p>
      </div>

      {/* Open Disputes */}
      {openDisputes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Open Disputes ({openDisputes.length})
          </h2>
          <div className="grid gap-6">
            {openDisputes.map((dispute) => renderDisputeCard(dispute))}
          </div>
        </div>
      )}

      {/* Resolved / Cancelled Disputes */}
      {resolvedDisputes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Resolved / Closed ({resolvedDisputes.length})
          </h2>
          <div className="grid gap-6">
            {resolvedDisputes.map((dispute) => renderDisputeCard(dispute))}
          </div>
        </div>
      )}

      {(!disputes || disputes.length === 0) && (
        <Card className="text-center py-12">
          <p className="text-gray-600">No disputes found</p>
        </Card>
      )}
    </div>
  );
}
