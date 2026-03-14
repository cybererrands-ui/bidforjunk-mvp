"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSubscriptionStatus,
  startSubscriptionCheckout,
  openBillingPortal,
} from "@/actions/subscriptions";
import type { SubscriptionTier } from "@/lib/constants";
import {
  Zap,
  TrendingUp,
  Crown,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const TIER_ICONS: Record<string, React.ElementType> = {
  free: Zap,
  starter: Zap,
  growth: TrendingUp,
  dominator: Crown,
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  growth: "bg-green-100 text-green-700",
  dominator: "bg-purple-100 text-purple-700",
};

export function SubscriptionCard() {
  const router = useRouter();
  const [status, setStatus] = useState<Awaited<
    ReturnType<typeof getSubscriptionStatus>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getSubscriptionStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </Card>
    );
  }

  if (!status) return null;

  const Icon = TIER_ICONS[status.tier] || Zap;
  const tierColor = TIER_COLORS[status.tier] || TIER_COLORS.free;
  const quotaPercent =
    status.quoteCap === Infinity
      ? 0
      : Math.min(100, (status.monthlyQuotesUsed / status.quoteCap) * 100);
  const quotaWarning = quotaPercent >= 80;
  const quotaExhausted = quotaPercent >= 100;

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const { url } = await openBillingPortal();
      if (url) window.location.href = url;
    } catch {
      // fallback — no stripe customer yet
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setActionLoading(true);
    try {
      const { url } = await startSubscriptionCheckout(tier);
      if (url) window.location.href = url;
    } catch {
      router.push("/pricing");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Your Plan</h2>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${tierColor}`}
        >
          <Icon className="h-4 w-4" />
          {status.tierName}
        </span>
      </div>

      {/* Trial banner */}
      {status.trialActive && !status.subscriptionActive && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Trial — {status.trialDaysRemaining} day
              {status.trialDaysRemaining === 1 ? "" : "s"} remaining
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Subscribe before your trial ends to keep submitting quotes.
            </p>
          </div>
        </div>
      )}

      {/* Quota meter */}
      {status.quoteCap !== Infinity && (
        <div className="mb-4">
          <div className="flex justify-between items-baseline text-sm mb-1">
            <span className="text-gray-600">
              Quotes used this {status.period === "month" ? "month" : "week"}
            </span>
            <span
              className={`font-bold ${
                quotaExhausted
                  ? "text-red-600"
                  : quotaWarning
                    ? "text-amber-600"
                    : "text-gray-900"
              }`}
            >
              {status.monthlyQuotesUsed} / {status.quoteCap}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quotaExhausted
                  ? "bg-red-500"
                  : quotaWarning
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, quotaPercent)}%` }}
            />
          </div>
          {quotaExhausted && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              Quota exhausted. Upgrade for more quotes.
            </p>
          )}
        </div>
      )}

      {status.quoteCap === Infinity && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-semibold text-purple-800">
            Unlimited Quotes
          </p>
          <p className="text-xs text-purple-600 mt-0.5">
            {status.monthlyQuotesUsed} submitted this month
          </p>
        </div>
      )}

      {/* Subscription details */}
      {status.subscriptionActive && status.subscriptionEndsAt && (
        <div className="text-xs text-gray-500 mb-4">
          Renews{" "}
          {new Date(status.subscriptionEndsAt).toLocaleDateString("en-CA", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {status.tier === "free" && (
          <Link
            href="/pricing"
            className="btn-primary text-center text-sm w-full"
          >
            Upgrade Plan
          </Link>
        )}

        {status.tier === "starter" && (
          <button
            onClick={() => handleUpgrade("growth")}
            disabled={actionLoading}
            className="btn-primary text-sm w-full disabled:opacity-50"
          >
            Upgrade to Growth
          </button>
        )}

        {status.tier === "growth" && (
          <button
            onClick={() => handleUpgrade("dominator")}
            disabled={actionLoading}
            className="btn-primary text-sm w-full disabled:opacity-50"
          >
            Upgrade to Dominator
          </button>
        )}

        {status.hasStripeCustomer && status.subscriptionActive && (
          <button
            onClick={handleManageBilling}
            disabled={actionLoading}
            className="btn-secondary text-sm w-full flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage Billing
          </button>
        )}
      </div>
    </Card>
  );
}
