import { Card } from "@/components/ui/card";
import { getAdminMetrics } from "@/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { SILENT_SIDE_RELEASE_HOURS } from "@/lib/constants";
import Link from "next/link";

export default async function AdminDashboard() {
  const metrics = await getAdminMetrics();
  const supabase = await createClient();

  // Count dispatch queue
  const { count: dispatchQueue } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .in("status", ["escrow_authorized", "ready_for_dispatch"]);

  // Count pending admin release (provider confirmed > 48h, customer not confirmed)
  const { data: confirmations } = await supabase
    .from("confirmations")
    .select("provider_confirmed_at")
    .eq("provider_confirmed", true)
    .eq("customer_confirmed", false)
    .is("deleted_at", null);

  const now = new Date();
  const pendingRelease = (confirmations || []).filter((c) => {
    if (!c.provider_confirmed_at) return false;
    const hours = (now.getTime() - new Date(c.provider_confirmed_at).getTime()) / (1000 * 60 * 60);
    return hours >= SILENT_SIDE_RELEASE_HOURS;
  }).length;

  // Subscription stats
  const { count: trialUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "provider")
    .eq("subscription_active", false)
    .not("trial_ends_at", "is", null);

  const { count: paidUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "provider")
    .eq("subscription_active", true);

  return (
    <div className="space-y-8">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and management — Hamilton, ON</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold mt-2">{metrics.totalUsers}</p>
        </Card>
        <Card>
          <p className="text-gray-600 text-sm">Total Jobs</p>
          <p className="text-3xl font-bold mt-2">{metrics.totalJobs}</p>
        </Card>
        <Card>
          <p className="text-gray-600 text-sm">Active Jobs</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{metrics.activeJobs}</p>
        </Card>
        <Card>
          <p className="text-gray-600 text-sm">Escrow Held (CAD)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(metrics.totalEscrow)}</p>
        </Card>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/verifications">
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${(metrics.pendingVerifications ?? 0) > 0 ? "border-orange-300 bg-orange-50" : ""}`}>
            <p className="text-gray-600 text-sm">Pending Verifications</p>
            <p className={`text-3xl font-bold mt-2 ${(metrics.pendingVerifications ?? 0) > 0 ? "text-orange-600" : ""}`}>
              {(metrics.pendingVerifications ?? 0)}
            </p>
            <p className="text-sm text-green-600 mt-2">Review →</p>
          </Card>
        </Link>

        <Link href="/admin/disputes">
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${(metrics.openDisputes ?? 0) > 0 ? "border-red-300 bg-red-50" : ""}`}>
            <p className="text-gray-600 text-sm">Open Disputes</p>
            <p className={`text-3xl font-bold mt-2 ${(metrics.openDisputes ?? 0) > 0 ? "text-red-600" : ""}`}>
              {(metrics.openDisputes ?? 0)}
            </p>
            <p className="text-sm text-green-600 mt-2">Manage →</p>
          </Card>
        </Link>

        <Link href="/admin/dispatch">
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${(dispatchQueue || 0) > 0 ? "border-indigo-300 bg-indigo-50" : ""}`}>
            <p className="text-gray-600 text-sm">Dispatch Queue</p>
            <p className={`text-3xl font-bold mt-2 ${(dispatchQueue || 0) > 0 ? "text-indigo-600" : ""}`}>
              {dispatchQueue || 0}
            </p>
            <p className="text-sm text-green-600 mt-2">Dispatch →</p>
          </Card>
        </Link>

        <Link href="/admin/jobs">
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${pendingRelease > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
            <p className="text-gray-600 text-sm">Pending Admin Release</p>
            <p className={`text-3xl font-bold mt-2 ${pendingRelease > 0 ? "text-amber-600" : ""}`}>
              {pendingRelease}
            </p>
            <p className="text-sm text-green-600 mt-2">Review →</p>
          </Card>
        </Link>
      </div>

      {/* Provider Subscription Stats */}
      <Card>
        <h2 className="font-semibold text-lg mb-4">Provider Subscriptions</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{trialUsers || 0}</p>
            <p className="text-sm text-gray-600">Trial Users</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{paidUsers || 0}</p>
            <p className="text-sm text-gray-600">Paid Subscribers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">
              {(metrics.totalUsers || 0) - (trialUsers || 0) - (paidUsers || 0)}
            </p>
            <p className="text-sm text-gray-600">Customers / Other</p>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { href: "/admin/jobs", label: "All Jobs" },
          { href: "/admin/verifications", label: "Verifications" },
          { href: "/admin/disputes", label: "Disputes" },
          { href: "/admin/users", label: "Manage Users" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card hover:shadow-md transition-shadow text-center py-6 text-green-600 hover:text-green-700 font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
