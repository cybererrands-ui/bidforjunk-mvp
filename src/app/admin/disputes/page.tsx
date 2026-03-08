import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  const { data: disputes } = await supabase
    .from("disputes")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1>Dispute Management</h1>
        <p className="text-gray-600 mt-2">
          Review and resolve customer disputes
        </p>
      </div>

      {disputes && disputes.length > 0 ? (
        <div className="grid gap-6">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Dispute {dispute.id.slice(0, 8)}
                  </h3>
                </div>
                <Badge
                  variant={
                    dispute.status === "resolved" ? "success" : "danger"
                  }
                >
                  {dispute.status}
                </Badge>
              </div>

              <p className="text-gray-600 mb-4">
                <strong>Reason:</strong> {dispute.reason}
              </p>

              {dispute.notes && (
                <p className="text-gray-600 mb-4">
                  <strong>Resolution:</strong> {dispute.notes}
                </p>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm text-gray-500">
                <span>Opened {formatDate(dispute.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600">No disputes found</p>
        </Card>
      )}
    </div>
  );
}
