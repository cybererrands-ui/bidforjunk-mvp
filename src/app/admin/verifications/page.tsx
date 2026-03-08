import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();

  const { data: verifications } = await supabase
    .from("provider_verifications")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const pendingVerifications = verifications?.filter(
    (v) => v.status === "pending"
  );
  const approvedVerifications = verifications?.filter(
    (v) => v.status === "approved"
  );
  const rejectedVerifications = verifications?.filter(
    (v) => v.status === "rejected"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1>Provider Verifications</h1>
        <p className="text-gray-600 mt-2">
          Review and approve background checks
        </p>
      </div>

      {pendingVerifications && pendingVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Pending Verification ({pendingVerifications.length})
          </h2>
          <div className="grid gap-6">
            {pendingVerifications.map((verification) => (
              <Card key={verification.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">
                      Provider {verification.provider_id.slice(0, 8)}
                    </h3>
                  </div>
                  <Badge>Pending</Badge>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Submitted:</strong>{" "}
                    {formatDate(verification.created_at)}
                  </p>
                </div>

                <button className="text-sm text-green-600 hover:underline">
                  Review Document
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {approvedVerifications && approvedVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Approved ({approvedVerifications.length})
          </h2>
          <div className="grid gap-6">
            {approvedVerifications.map((verification) => (
              <Card key={verification.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      Provider {verification.provider_id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Verified {formatDate(verification.verified_at || "")}
                    </p>
                  </div>
                  <Badge variant="success">Approved</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {rejectedVerifications && rejectedVerifications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Rejected ({rejectedVerifications.length})
          </h2>
          <div className="grid gap-6">
            {rejectedVerifications.map((verification) => (
              <Card key={verification.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">
                      Provider {verification.provider_id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Rejected {formatDate(verification.verified_at || "")}
                    </p>
                  </div>
                  <Badge variant="danger">Rejected</Badge>
                </div>
                {verification.rejection_reason && (
                  <p className="text-sm text-gray-600">
                    Reason: {verification.rejection_reason}
                  </p>
                )}
              </Card>
            ))}
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
