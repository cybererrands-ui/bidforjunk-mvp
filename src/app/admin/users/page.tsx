import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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

  const customers = profiles?.filter((p) => p.role === "customer") || [];
  const providers = profiles?.filter((p) => p.role === "provider") || [];
  const admins = profiles?.filter((p) => p.role === "admin") || [];

  async function handleSuspend(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const reason = formData.get("reason") as string;
    const { suspendUser } = await import("@/actions/admin");
    await suspendUser(userId, reason || "Admin action");
    revalidatePath("/admin/users");
  }

  async function handleUnsuspend(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    const { unsuspendUser } = await import("@/actions/admin");
    await unsuspendUser(userId);
    revalidatePath("/admin/users");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1>User Management</h1>
        <p className="text-gray-600 mt-2">
          {profiles?.length || 0} total users — {customers.length} customers, {providers.length} providers, {admins.length} admins
        </p>
      </div>

      {profiles && profiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Verified</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Subscription</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Joined</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{profile.display_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{profile.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={roleColors[profile.role as keyof typeof roleColors]}>
                      {profile.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {profile.is_suspended ? (
                      <div>
                        <Badge variant="danger">Suspended</Badge>
                        {profile.suspended_reason && (
                          <p className="text-xs text-gray-500 mt-1">{profile.suspended_reason}</p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {profile.is_verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">No</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {profile.role === "provider" ? (
                      profile.subscription_active ? (
                        <Badge variant="success">Subscribed</Badge>
                      ) : profile.trial_ends_at ? (
                        <span className="text-gray-600">
                          Trial: {formatDate(profile.trial_ends_at)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    {profile.is_suspended ? (
                      <form action={handleUnsuspend}>
                        <input type="hidden" name="userId" value={profile.id} />
                        <button
                          type="submit"
                          className="text-sm px-3 py-1 border border-green-300 text-green-700 rounded hover:bg-green-50"
                        >
                          Unsuspend
                        </button>
                      </form>
                    ) : profile.role !== "admin" ? (
                      <form action={handleSuspend} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={profile.id} />
                        <input
                          type="text"
                          name="reason"
                          placeholder="Reason"
                          className="text-sm px-2 py-1 border border-gray-300 rounded w-28"
                        />
                        <button
                          type="submit"
                          className="text-sm px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"
                        >
                          Suspend
                        </button>
                      </form>
                    ) : null}
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
