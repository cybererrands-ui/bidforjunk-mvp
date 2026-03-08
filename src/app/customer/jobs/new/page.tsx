"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { JUNK_TYPES } from "@/lib/constants";
import { createJob } from "@/actions/jobs";

export default function NewJobPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location_city: "",
    location_state: "",
    location_address: "",
    junk_types: [] as string[],
    estimated_volume: "",
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

      const job = await createJob(profile.id, {
        title: formData.title,
        description: formData.description,
        location_city: formData.location_city,
        location_state: formData.location_state,
        location_address: formData.location_address,
        junk_types: formData.junk_types as any,
        estimated_volume: formData.estimated_volume || undefined,
      });

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
            label="City"
            value={formData.location_city}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_city: e.target.value,
              }))
            }
            placeholder="e.g., New York"
            required
          />

          <Select
            label="State"
            value={formData.location_state}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                location_state: e.target.value,
              }))
            }
            options={[
              { value: "AL", label: "Alabama" },
              { value: "AK", label: "Alaska" },
              { value: "AZ", label: "Arizona" },
              { value: "AR", label: "Arkansas" },
              { value: "CA", label: "California" },
              { value: "CO", label: "Colorado" },
              { value: "CT", label: "Connecticut" },
              { value: "DE", label: "Delaware" },
              { value: "FL", label: "Florida" },
              { value: "GA", label: "Georgia" },
              { value: "HI", label: "Hawaii" },
              { value: "ID", label: "Idaho" },
              { value: "IL", label: "Illinois" },
              { value: "IN", label: "Indiana" },
              { value: "IA", label: "Iowa" },
              { value: "KS", label: "Kansas" },
              { value: "KY", label: "Kentucky" },
              { value: "LA", label: "Louisiana" },
              { value: "ME", label: "Maine" },
              { value: "MD", label: "Maryland" },
              { value: "MA", label: "Massachusetts" },
              { value: "MI", label: "Michigan" },
              { value: "MN", label: "Minnesota" },
              { value: "MS", label: "Mississippi" },
              { value: "MO", label: "Missouri" },
              { value: "MT", label: "Montana" },
              { value: "NE", label: "Nebraska" },
              { value: "NV", label: "Nevada" },
              { value: "NH", label: "New Hampshire" },
              { value: "NJ", label: "New Jersey" },
              { value: "NM", label: "New Mexico" },
              { value: "NY", label: "New York" },
              { value: "NC", label: "North Carolina" },
              { value: "ND", label: "North Dakota" },
              { value: "OH", label: "Ohio" },
              { value: "OK", label: "Oklahoma" },
              { value: "OR", label: "Oregon" },
              { value: "PA", label: "Pennsylvania" },
              { value: "RI", label: "Rhode Island" },
              { value: "SC", label: "South Carolina" },
              { value: "SD", label: "South Dakota" },
              { value: "TN", label: "Tennessee" },
              { value: "TX", label: "Texas" },
              { value: "UT", label: "Utah" },
              { value: "VT", label: "Vermont" },
              { value: "VA", label: "Virginia" },
              { value: "WA", label: "Washington" },
              { value: "WV", label: "West Virginia" },
              { value: "WI", label: "Wisconsin" },
              { value: "WY", label: "Wyoming" },
            ]}
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
