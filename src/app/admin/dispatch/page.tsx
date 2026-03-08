import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AdminDispatchPage() {
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("dispatch_assignments")
    .select("*")
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1>Dispatch Board</h1>
        <p className="text-gray-600 mt-2">
          Manage job assignments and scheduling
        </p>
      </div>

      {assignments && assignments.length > 0 ? (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Assignment {assignment.id.slice(0, 8)}
                  </h3>
                </div>
                <Badge>Assigned</Badge>
              </div>

              <div className="space-y-2 mb-4">
                {assignment.scheduled_date && (
                  <p className="text-sm">
                    <strong>Scheduled:</strong>{" "}
                    {formatDate(assignment.scheduled_date)}
                  </p>
                )}
                {assignment.scheduled_time_start && (
                  <p className="text-sm">
                    <strong>Time:</strong> {assignment.scheduled_time_start} -{" "}
                    {assignment.scheduled_time_end}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Assigned {formatDate(assignment.assigned_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600">No dispatch assignments yet</p>
        </Card>
      )}
    </div>
  );
}
