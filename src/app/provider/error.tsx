"use client";

import { useEffect } from "react";

export default function ProviderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Provider route error:", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-600 mb-2">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
