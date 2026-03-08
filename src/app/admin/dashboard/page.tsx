import { Card } from "@/components/ui/card";
import { getAdminMetrics } from "@/actions/admin";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboard() {
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1>Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and management</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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
          <p className="text-3xl font-bold text-green-600 mt-2">
            {metrics.activeJobs}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <p className="text-gray-600 text-sm">Pending Verifications</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {metrics.pendingVerifications}
          </p>
          <Link
            href="/admin/verifications"
            className="text-sm text-green-600 hover:underline mt-4 inline-block"
          >
            Review now →
          </Link>
        </Card>

        <Card>
          <p className="text-gray-600 text-sm">Open Disputes</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {metrics.openDisputes}
          </p>
          <Link
            href="/admin/disputes"
            className="text-sm text-green-600 hover:underline mt-4 inline-block"
          >
            Manage →
          </Link>
        </Card>

        <Card>
          <p className="text-gray-600 text-sm">Escrow in Hold</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(metrics.totalEscrow)}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { href: "/admin/jobs", label: "View All Jobs" },
          { href: "/admin/verifications", label: "Verifications" },
          { href: "/admin/disputes", label: "Disputes" },
          { href: "/admin/users", label: "Manage Users" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card hover:shadow-md transition-shadow text-center py-8 text-green-600 hover:text-green-700 font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
