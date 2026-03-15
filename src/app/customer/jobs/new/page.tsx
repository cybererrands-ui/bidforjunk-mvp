"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { JUNK_TYPES, LAUNCH_CITY, LAUNCH_STATE, CURRENCY_SYMBOL } from "@/lib/constants";
import { createJob, uploadJobPhotos } from "@/actions/jobs";

const CANADIAN_PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_city: LAUNCH_CITY,
    location_state: LAUNCH_STATE,
    location_address: "",
    junk_types: [] as string[],
    estimated_volume: "",
    budget_dollars: "",
    preferred_time: "",
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

      // Convert budget from dollars to cents
      const budgetDollars = parseFloat(formData.budget_dollars);
      if (isNaN(budgetDollars) || budgetDollars <= 0) {
        throw new Error("Please enter a valid budget amount");
      }
      const budgetCents = Math.round(budgetDollars * 100);

      const job = await createJob(profile.id, {
        title: formData.title,
        description: formData.description,
        location_city: formData.location_city,
        location_state: formData.location_state,
        location_address: formData.location_address,
        junk_types: formData.junk_types as any,
        estimated_volume: formData.estimated_volume || undefined,
        budget_cents: budgetCents,
        preferred_time: formData.preferred_time || undefined,
      });

      // Upload photos if any were selected
      if (photos.length > 0) {
        try {
          await uploadJobPhotos(job.id, photos);
        } catch {
          // Job was created, photos failed - continue to job page
          console.error("Photo upload failed, but job was created");
        }
      }

      router.push(`/customer/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleJunkTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      junk_types: prev.junk_types.includes(type)
        ? prev.junk_types.filter((t) => t !== type)
        : [...prev.junk_types, type],
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="mb-6">Post a New Job</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <Input
            label="Job Title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="e.g., Clear out garage and basement"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Describe what needs to be removed..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Types of Junk
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
            label={`Budget (${CURRENCY_SYMBOL} CAD)`}
            type="number"
            min="1"
            step="0.01"
            value={formData.budget_dollars}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                budget_dollars: e.target.value,
              }))
            }
            placeholder="e.g., 250.00"
            required
          />

          <Input
            label="Preferred Time"
            value={formData.preferred_time}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                preferred_time: e.target.value,
              }))
            }
            placeholder="e.g., Weekday mornings, ASAP, or any specific date"
          />

          <Input
            label="City"
            value={formData.location_city}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_city: e.target.value,
              }))
            }
            placeholder="e.g., Hamilton"
            required
          />

          <Select
            label="Province"
            value={formData.location_state}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_state: e.target.value,
              }))
            }
            options={CANADIAN_PROVINCES}
            required
          />

          <Input
            label="Address"
            value={formData.location_address}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_address: e.target.value,
              }))
            }
            placeholder="Street address"
            required
          />

          <Input
            label="Estimated Volume (Optional)"
            value={formData.estimated_volume}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estimated_volume: e.target.value,
              }))
            }
            placeholder="e.g., 2 truckloads"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
            />
            {photos.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {photos.length} photo{photos.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              Post Job
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
