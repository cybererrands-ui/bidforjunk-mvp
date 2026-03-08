"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JUNK_TYPES } from "@/lib/constants";
import { completeOnboarding } from "@/actions/providers";

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    service_areas: [] as string[],
    junk_types: [] as string[],
    vehicle_types: [] as string[],
    hourly_rate: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userData.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      await completeOnboarding(profile.id, {
        service_areas: formData.service_areas,
        junk_types: formData.junk_types as any,
        vehicle_types: formData.vehicle_types,
        hourly_rate: formData.hourly_rate
          ? parseInt(formData.hourly_rate)
          : undefined,
        bio: formData.bio || undefined,
      });

      router.push("/provider/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = (city: string) => {
    if (city.trim() && !formData.service_areas.includes(city.trim())) {
      setFormData((prev) => ({
        ...prev,
        service_areas: [...prev.service_areas, city.trim()],
      }));
    }
  };

  const handleRemoveCity = (city: string) => {
    setFormData((prev) => ({
      ...prev,
      service_areas: prev.service_areas.filter((c) => c !== city),
    }));
  };

  const handleJunkTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      junk_types: prev.junk_types.includes(type)
        ? prev.junk_types.filter((t) => t !== type)
        : [...prev.junk_types, type],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="mb-2">Complete Your Profile</h1>
      <p className="text-gray-600 mb-6">
        Set up your service areas and specialties to start receiving bids
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service Cities
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a city"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    handleAddCity(input.value);
                    input.value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.service_areas.map((city) => (
                <Badge key={city} variant="info">
                  {city}
                  <button
                    type="button"
                    onClick={() => handleRemoveCity(city)}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Junk Types You Handle
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(JUNK_TYPES).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.junk_types.includes(key)}
                    onChange={() => handleJunkTypeChange(key)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Hourly Rate ($)"
            value={formData.hourly_rate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hourly_rate: e.target.value }))
            }
            type="number"
            placeholder="e.g., 75"
          />

          <Textarea
            label="Bio"
            value={formData.bio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder="Tell customers about your experience..."
          />

          <div className="flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              Complete Setup
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
