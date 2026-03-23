import Link from "next/link";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function SubscriptionCancelPage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-6 text-center">
      <Card>
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Checkout Cancelled
        </h1>

        <p className="text-gray-600 mb-6">
          No worries — you weren&apos;t charged. You can subscribe anytime
          from your dashboard or the pricing page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing" className="btn-primary">
            View Plans
          </Link>
          <Link href="/provider/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
