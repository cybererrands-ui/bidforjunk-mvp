"use client";

import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md card text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a confirmation link to your email. Please click the
          link to verify your account and get started.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Check your spam folder if you don&apos;t see the email.
        </p>
        <Link href="/" className="text-green-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
