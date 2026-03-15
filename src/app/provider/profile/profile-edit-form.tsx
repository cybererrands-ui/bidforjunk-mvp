"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateProviderProfile } from "@/actions/providers";
import { JUNK_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { CheckCircle, Save, AlertTriangle } from "lucide-react";

interface ProfileEditFormProps {
  profile: Record<string, unknown>;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    display_name: (profile.display_name as string) || "",
    bio: (profile.bio as string) || "",
    phone_number: (profile.phone_number as string) || "",
    service_areas: (profile.service_areas as string[]) || [],
    junk_types: (profile.junk_types as string[]) || [],
    hourly_rate: profile.hourly_rate ? String(profile.hourly_rate) : "",
    crew_size: profile.crew_size ? String(profile.crew_size) : "",
    truck_size: (profile.truck_size as string) || "",
    same_day_available: (profile.same_day_available as boolean) || false,
    disposal_practices: (profile.disposal_practices as string) || "",
    hours_of_operation: (profile.hours_of_operation as string) || "",
    years_in_business: profile.years_in_business
      ? String(profile.years_in_business)
      : "",
    payment_methods_accepted:
      (profile.payment_methods_accepted as string[]) || [],
    business_phone: (profile.business_phone as string) || "",
    business_email: (profile.business_email as string) || "",
    business_website: (profile.business_website as string) || "",
  });

  const [newCity, setNewCity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProviderProfile(profile.id as string, {
        display_name: formData.display_name,
        bio: formData.bio || null,
        phone_number: formData.phone_number || null,
        service_areas: formData.service_areas,
        junk_types: formData.junk_types,
        hourly_rate: formData.hourly_rate
          ? parseInt(formData.hourly_rate)
          : null,
        crew_size: formData.crew_size ? parseInt(formData.crew_size) : null,
        truck_size: formData.truck_size || null,
        same_day_available: formData.same_day_available,
        disposal_practices: formData.disposal_practices || null,
        hours_of_operation: formData.hours_of_operation || null,
        years_in_business: formData.years_in_business
          ? parseInt(formData.years_in_business)
          : null,
        payment_methods_accepted: formData.payment_methods_accepted,
        business_phone: formData.business_phone || null,
        business_email: formData.business_email || null,
        business_website: formData.business_website || null,
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addCity = () => {
    const trimmed = newCity.trim();
    if (trimmed && !formData.service_areas.includes(trimmed)) {
      setFormData({
        ...formData,
        service_areas: [...formData.service_areas, trimmed],
      });
      setNewCity("");
    }
  };

  const removeCity = (city: string) => {
    setFormData({
      ...formData,
      service_areas: formData.service_areas.filter((c) => c !== city),
    });
  };

  const toggleJunkType = (type: string) => {
    setFormData({
      ...formData,
      junk_types: formData.junk_types.includes(type)
        ? formData.junk_types.filter((t) => t !== type)
        : [...formData.junk_types, type],
    });
  };

  const togglePaymentMethod = (method: string) => {
    setFormData({
      ...formData,
      payment_methods_accepted:
        formData.payment_methods_accepted.includes(method)
          ? formData.payment_methods_accepted.filter((m) => m !== method)
          : [...formData.payment_methods_accepted, method],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Profile updated successfully!
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              placeholder="(905) 555-0123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Tell customers about your experience and services..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Service Areas */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Service Areas</h2>
          <div className="flex gap-2">
            <Input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Add a city (e.g., Hamilton)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCity();
                }
              }}
            />
            <Button type="button" onClick={addCity} variant="secondary">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.service_areas.map((city) => (
              <Badge key={city} variant="success">
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="ml-1 hover:text-red-600"
                >
                  &times;
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Junk Types */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Junk Types</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(JUNK_TYPES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleJunkType(key)}
                className={`p-2 rounded-lg border text-sm text-center transition-colors ${
                  formData.junk_types.includes(key)
                    ? "bg-green-100 border-green-600 text-green-800"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Operations */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Operations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate (CAD)
              </label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({ ...formData, hourly_rate: e.target.value })
                }
                placeholder="75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crew Size
              </label>
              <Input
                type="number"
                value={formData.crew_size}
                onChange={(e) =>
                  setFormData({ ...formData, crew_size: e.target.value })
                }
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Truck Size
              </label>
              <Input
                value={formData.truck_size}
                onChange={(e) =>
                  setFormData({ ...formData, truck_size: e.target.value })
                }
                placeholder="e.g., 16ft box truck"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years in Business
              </label>
              <Input
                type="number"
                value={formData.years_in_business}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    years_in_business: e.target.value,
                  })
                }
                placeholder="5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours of Operation
            </label>
            <Input
              value={formData.hours_of_operation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hours_of_operation: e.target.value,
                })
              }
              placeholder="Mon-Fri 7am-6pm, Sat 8am-2pm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disposal Practices
            </label>
            <Textarea
              value={formData.disposal_practices}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  disposal_practices: e.target.value,
                })
              }
              placeholder="Describe how you dispose of junk (recycling, donation, landfill, etc.)"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="same_day"
              checked={formData.same_day_available}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  same_day_available: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="same_day" className="text-sm text-gray-700">
              Same-day service available
            </label>
          </div>
        </div>
      </Card>

      {/* Contact / Business */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Contact
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Phone
              </label>
              <Input
                value={formData.business_phone}
                onChange={(e) =>
                  setFormData({ ...formData, business_phone: e.target.value })
                }
                placeholder="(905) 555-0123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Email
              </label>
              <Input
                type="email"
                value={formData.business_email}
                onChange={(e) =>
                  setFormData({ ...formData, business_email: e.target.value })
                }
                placeholder="info@yourcompany.ca"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              value={formData.business_website}
              onChange={(e) =>
                setFormData({ ...formData, business_website: e.target.value })
              }
              placeholder="https://yourcompany.ca"
            />
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment Methods Accepted
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePaymentMethod(key)}
                className={`p-2 rounded-lg border text-sm text-center transition-colors ${
                  formData.payment_methods_accepted.includes(key)
                    ? "bg-green-100 border-green-600 text-green-800"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
