import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardData } from "@/actions/admin";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from "@/lib/constants";
import Link from "next/link";

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();
  const { kpi, actionItems, pipeline, subscriptions, recentJobs, recentSignups, topProviders } = data;

  const totalActionItems =
    actionItems.pendingVerifications +
    actionItems.openDisputes +
    actionItems.dispatchQueue +
    actionItems.pendingRelease;

  // Pipeline stages in order for the funnel
  const pipelineStages = [
    { key: "open", label: "Open" },
    { key: "negotiating", label: "Negotiating" },
    { key: "locked", label: "Locked" },
    { key: "accepted", label: "Accepted" },
    { key: "ready_for_dispatch", label: "Ready" },
    { key: "dispatched", label: "Dispatched" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "pending_admin_release", label: "Pending Release" },
    { key: "released", label: "Released" },
    { key: "cancelled", label: "Cancelled" },
    { key: "disputed", label: "Disputed" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Command Center</h1>
          <p className="text-gray-600 mt-1">
            BidForJunk — Hamilton, ON &middot;{" "}
            {new Date().toLocaleDateString("en-CA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {totalActionItems > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-red-800 font-medium text-sm">
              {totalActionItems} item{totalActionItems !== 1 ? "s" : ""} need
              attention
            </span>
          </div>
        )}
      </div>

      {/* === ACTION ITEMS (urgent, at top) === */}
      {totalActionItems > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Requires Your Action
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionCard
              href="/admin/verifications"
              label="Pending Verifications"
              count={actionItems.pendingVerifications}
              color="orange"
            />
            <ActionCard
              href="/admin/disputes"
              label="Open Disputes"
              count={actionItems.openDisputes}
              color="red"
            />
            <ActionCard
              href="/admin/dispatch"
              label="Dispatch Queue"
              count={actionItems.dispatchQueue}
              color="indigo"
            />
            <ActionCard
              href="/admin/jobs"
              label="Pending Release (48h)"
              count={actionItems.pendingRelease}
              color="amber"
            />
          </div>
        </div>
      )}

      {/* === KPI METRICS === */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Platform Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total Users" value={kpi.totalUsers} />
          <KpiCard label="Customers" value={kpi.totalCustomers} />
          <KpiCard label="Providers" value={kpi.totalProviders} />
          <KpiCard label="Total Jobs" value={kpi.totalJobs} />
          <KpiCard
            label="Paid Subscribers"
            value={subscriptions.paid}
            highlight="green"
          />
          <KpiCard
            label="Trial Users"
            value={subscriptions.trial}
            highlight="amber"
          />
        </div>
      </div>

      {/* === JOB PIPELINE + SUBSCRIPTIONS (side by side) === */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="font-semibold text-lg mb-4">Job Pipeline</h2>
            <div className="space-y-2">
              {pipelineStages.map((stage) => {
                const count = pipeline[stage.key] || 0;
                const maxCount = Math.max(
                  1,
                  ...pipelineStages.map((s) => pipeline[s.key] || 0)
                );
                const widthPct = Math.max(2, (count / maxCount) * 100);
                const colorClass =
                  JOB_STATUS_COLORS[
                    stage.key as keyof typeof JOB_STATUS_COLORS
                  ] || "bg-gray-100 text-gray-800";

                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-28 text-right shrink-0">
                      {stage.label}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center px-2 text-xs font-medium transition-all ${colorClass}`}
                        style={{ width: `${widthPct}%`, minWidth: "28px" }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {kpi.activeJobs}
                </p>
                <p className="text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {kpi.releasedJobs}
                </p>
                <p className="text-gray-500">Released</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {kpi.cancelledJobs}
                </p>
                <p className="text-gray-500">Cancelled</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscriptions + Top Providers */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-lg mb-4">
              Provider Subscriptions
            </h2>
            <div className="space-y-3">
              <SubRow
                label="Paid Subscribers"
                count={subscriptions.paid}
                color="green"
              />
              <SubRow
                label="Trial Users"
                count={subscriptions.trial}
                color="blue"
              />
              <SubRow
                label="Free Tier"
                count={subscriptions.free}
                color="gray"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Total providers:{" "}
                <span className="font-semibold text-gray-800">
                  {kpi.totalProviders}
                </span>
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-lg mb-4">Top Providers</h2>
            {topProviders.length === 0 ? (
              <p className="text-gray-500 text-sm">No providers yet.</p>
            ) : (
              <div className="space-y-3">
                {topProviders.map((p: any, i: number) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {p.display_name}
                          {p.subscription_active && (
                            <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              PRO
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.total_jobs_completed} jobs &middot;{" "}
                          {p.avg_rating
                            ? `${Number(p.avg_rating).toFixed(1)}★`
                            : "No rating"}
                        </p>
                      </div>
                    </div>
                    {p.is_verified && (
                      <span className="text-green-600 text-xs">Verified</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* === RECENT JOBS + RECENT SIGNUPS (side by side) === */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Jobs</h2>
            <Link
              href="/admin/jobs"
              className="text-sm text-green-600 hover:text-green-700"
            >
              View all &rarr;
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No jobs yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href="/admin/jobs"
                        className="text-sm font-medium text-gray-900 hover:text-green-600 truncate block"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.customer_name} &middot; {job.location_city} &middot;{" "}
                        {timeAgo(job.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(job.agreed_price_cents || job.budget_cents) && (
                        <span className="text-xs font-medium text-gray-700">
                          {formatCurrency(
                            job.agreed_price_cents || job.budget_cents
                          )}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          JOB_STATUS_COLORS[
                            job.status as keyof typeof JOB_STATUS_COLORS
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {JOB_STATUS_LABELS[
                          job.status as keyof typeof JOB_STATUS_LABELS
                        ] || job.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Signups */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Signups</h2>
            <Link
              href="/admin/users"
              className="text-sm text-green-600 hover:text-green-700"
            >
              View all &rarr;
            </Link>
          </div>
          {recentSignups.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No users yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentSignups.map((user: any) => (
                <div
                  key={user.id}
                  className="py-3 first:pt-0 last:pb-0 flex justify-between items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.display_name || "Unnamed"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email} &middot; {timeAgo(user.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        user.role === "provider"
                          ? "info"
                          : user.role === "admin"
                            ? "warning"
                            : "default"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.role === "provider" && user.subscription_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* === QUICK NAVIGATION === */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Management
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: "/admin/jobs", label: "All Jobs", icon: "📋" },
            { href: "/admin/dispatch", label: "Dispatch", icon: "🚛" },
            { href: "/admin/disputes", label: "Disputes", icon: "⚖️" },
            { href: "/admin/verifications", label: "Verifications", icon: "✅" },
            { href: "/admin/users", label: "Users", icon: "👥" },
            { href: "/", label: "View Site", icon: "🌐" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-green-700"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "green" | "amber" | "red";
}) {
  const colorMap = {
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  const valueColor = highlight ? colorMap[highlight] : "text-gray-900";

  return (
    <Card className="!p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
    </Card>
  );
}

function ActionCard({
  href,
  label,
  count,
  color,
}: {
  href: string;
  label: string;
  count: number;
  color: "orange" | "red" | "indigo" | "amber";
}) {
  if (count === 0) return null;

  const styles = {
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
    indigo: "border-indigo-300 bg-indigo-50 text-indigo-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
  };
  const numColor = {
    orange: "text-orange-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
    amber: "text-amber-600",
  };

  return (
    <Link href={href}>
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow border ${styles[color]}`}
      >
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-end justify-between mt-2">
          <p className={`text-3xl font-bold ${numColor[color]}`}>{count}</p>
          <span className="text-sm font-medium opacity-70">Review &rarr;</span>
        </div>
      </Card>
    </Link>
  );
}

function SubRow({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "green" | "blue" | "gray";
}) {
  const dotColor = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    gray: "bg-gray-400",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor[color]}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  );
}
