import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccessPage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-6 text-center">
      <Card>
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Subscription Activated!
        </h1>

        <p className="text-gray-600 mb-6">
          Your plan is now active. You can start submitting quotes
          immediately. Head to your dashboard to see available jobs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/provider/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link href="/provider/jobs" className="btn-secondary">
            Browse Jobs
          </Link>
        </div>
      </Card>
    </div>
  );
}
