"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSubscriptionCheckout } from "@/actions/subscriptions";
import type { SubscriptionTier } from "@/lib/constants";
import { ArrowRight, Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  tier: SubscriptionTier;
  label: string;
  highlighted?: boolean;
  className?: string;
}

export function CheckoutButton({
  tier,
  label,
  highlighted = false,
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { url } = await startSubscriptionCheckout(tier);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout";

      // If not authenticated, redirect to signup
      if (message.includes("Not authenticated")) {
        router.push(`/signup?plan=${tier}`);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-bold text-base transition-colors disabled:opacity-60 ${
          className ||
          (highlighted
            ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20"
            : "bg-gray-900 text-white hover:bg-gray-800")
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
      {error && (
        <p className="text-red-600 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
