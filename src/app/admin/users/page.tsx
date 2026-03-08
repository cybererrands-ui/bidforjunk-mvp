import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const roleColors = {
    customer: "info",
    provider: "success",
    admin: "danger",
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <h1>User Management</h1>
        <p className="text-gray-600 mt-2">View and manage platform users</p>
      </div>

      {profiles && profiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Verified</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{profile.display_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {profile.email}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        roleColors[profile.role as keyof typeof roleColors]
                      }
                    >
                      {profile.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {profile.is_suspended ? (
                      <Badge variant="danger">Suspended</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {profile.is_verified ? (
                      <Badge variant="success">Yes</Badge>
                    ) : (
                      <Badge variant="warning">No</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-600">No users found</p>
        </Card>
      )}
    </div>
  );
}
