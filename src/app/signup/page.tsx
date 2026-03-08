"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { UserRole } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"role" | "credentials">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!role) throw new Error("Please select a role");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      router.push(
        role === "customer" ? "/customer/dashboard" : "/provider/onboarding"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md card">
        <h1 className="text-center mb-8">Join BidForJunk</h1>

        {step === "role" ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-center mb-6">I want to...</p>

            <button
              onClick={() => {
                setRole("customer");
                setStep("credentials");
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left"
            >
              <div className="font-semibold text-gray-900">Post Jobs</div>
              <div className="text-sm text-gray-600">
                I need junk removal services
              </div>
            </button>

            <button
              onClick={() => {
                setRole("provider");
                setStep("credentials");
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left"
            >
              <div className="font-semibold text-gray-900">
                Provide Services
              </div>
              <div className="text-sm text-gray-600">
                I offer junk removal services
              </div>
            </button>

            <div className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:underline">
                Log in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setStep("role");
                setError(null);
              }}
              className="text-green-600 hover:underline text-sm mb-4"
            >
              ← Back
            </button>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:underline">
                Log in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
