"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  JUNK_TYPES,
  ID_TYPES,
  BUSINESS_TYPES,
  PROVINCES,
} from "@/lib/constants";
import { completeOnboarding } from "@/actions/providers";
import {
  CheckCircle,
  Shield,
  FileText,
  Building2,
  Truck,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                               */
/* ------------------------------------------------------------------ */

type Step = "services" | "identity" | "business" | "insurance" | "review";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "services", label: "Services", icon: Truck },
  { key: "identity", label: "Identity", icon: Shield },
  { key: "business", label: "Business", icon: Building2 },
  { key: "insurance", label: "Insurance", icon: FileText },
  { key: "review", label: "Review", icon: CheckCircle },
];

/* ------------------------------------------------------------------ */
/*  PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("services");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Services ────────────────────────────────────────────
  const [serviceData, setServiceData] = useState({
    service_areas: [] as string[],
    junk_types: [] as string[],
    vehicle_types: [] as string[],
    hourly_rate: "",
    bio: "",
    crew_size: "",
    truck_size: "",
    same_day_available: false,
    disposal_practices: "",
    hours_of_operation: "",
  });

  // ── Identity ────────────────────────────────────────────
  const [identityData, setIdentityData] = useState({
    legal_full_name: "",
    date_of_birth: "",
    id_type: "",
    id_expiry_date: "",
  });
  const [idFile, setIdFile] = useState<File | null>(null);

  // ── Business ────────────────────────────────────────────
  const [businessData, setBusinessData] = useState({
    legal_business_name: "",
    operating_name: "",
    business_registration_number: "",
    province_of_registration: "",
    business_type: "",
    business_address: "",
    business_phone: "",
    business_email: "",
    business_website: "",
  });

  // ── Insurance ───────────────────────────────────────────
  const [insuranceData, setInsuranceData] = useState({
    insurer_name: "",
    insurance_policy_number: "",
    insurance_coverage_type: "",
    insurance_coverage_amount: "",
    insurance_effective_date: "",
    insurance_expiry_date: "",
  });
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);

  /* ------------------------------------------------------------------ */
  /*  STEP NAVIGATION                                                    */
  /* ------------------------------------------------------------------ */

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].key);
  };

  const goBack = () => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1].key);
  };

  /* ------------------------------------------------------------------ */
  /*  FILE UPLOAD HELPER                                                 */
  /* ------------------------------------------------------------------ */

  async function uploadFile(
    providerId: string,
    file: File,
    folder: string
  ): Promise<string> {
    const filename = `${Date.now()}-${file.name}`;
    const path = `${providerId}/${folder}/${filename}`;
    const { data, error: uploadError } = await supabase.storage
      .from("verification-docs")
      .upload(path, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("verification-docs").getPublicUrl(data.path);

    return publicUrl;
  }

  /* ------------------------------------------------------------------ */
  /*  SUBMIT                                                             */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async () => {
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

      // Upload files if provided
      let idDocUrl: string | undefined;
      let insuranceCertUrl: string | undefined;

      if (idFile) {
        idDocUrl = await uploadFile(profile.id, idFile, "id-documents");
      }
      if (insuranceFile) {
        insuranceCertUrl = await uploadFile(
          profile.id,
          insuranceFile,
          "insurance-certificates"
        );
      }

      // Complete onboarding with all data
      await completeOnboarding(profile.id, {
        // Services
        service_areas: serviceData.service_areas,
        junk_types: serviceData.junk_types as any,
        vehicle_types: serviceData.vehicle_types,
        hourly_rate: serviceData.hourly_rate
          ? parseInt(serviceData.hourly_rate)
          : undefined,
        bio: serviceData.bio || undefined,
        crew_size: serviceData.crew_size
          ? parseInt(serviceData.crew_size)
          : undefined,
        truck_size: serviceData.truck_size || undefined,
        same_day_available: serviceData.same_day_available,
        disposal_practices: serviceData.disposal_practices || undefined,
        hours_of_operation: serviceData.hours_of_operation || undefined,
        // Identity
        legal_full_name: identityData.legal_full_name || undefined,
        date_of_birth: identityData.date_of_birth || undefined,
        id_type: identityData.id_type || undefined,
        id_expiry_date: identityData.id_expiry_date || undefined,
        id_document_url: idDocUrl,
        // Business
        legal_business_name: businessData.legal_business_name || undefined,
        operating_name: businessData.operating_name || undefined,
        business_registration_number:
          businessData.business_registration_number || undefined,
        province_of_registration:
          businessData.province_of_registration || undefined,
        business_type: businessData.business_type || undefined,
        business_address: businessData.business_address || undefined,
        business_phone: businessData.business_phone || undefined,
        business_email: businessData.business_email || undefined,
        business_website: businessData.business_website || undefined,
        // Insurance
        insurer_name: insuranceData.insurer_name || undefined,
        insurance_policy_number:
          insuranceData.insurance_policy_number || undefined,
        insurance_coverage_type:
          insuranceData.insurance_coverage_type || undefined,
        insurance_coverage_amount: insuranceData.insurance_coverage_amount
          ? parseInt(insuranceData.insurance_coverage_amount) * 100
          : undefined,
        insurance_effective_date:
          insuranceData.insurance_effective_date || undefined,
        insurance_expiry_date:
          insuranceData.insurance_expiry_date || undefined,
        insurance_certificate_url: insuranceCertUrl,
      });

      router.push("/provider/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  CITY HELPERS                                                       */
  /* ------------------------------------------------------------------ */

  const handleAddCity = (city: string) => {
    if (city.trim() && !serviceData.service_areas.includes(city.trim())) {
      setServiceData((prev) => ({
        ...prev,
        service_areas: [...prev.service_areas, city.trim()],
      }));
    }
  };

  const handleRemoveCity = (city: string) => {
    setServiceData((prev) => ({
      ...prev,
      service_areas: prev.service_areas.filter((c) => c !== city),
    }));
  };

  const handleJunkTypeChange = (type: string) => {
    setServiceData((prev) => ({
      ...prev,
      junk_types: prev.junk_types.includes(type)
        ? prev.junk_types.filter((t) => t !== type)
        : [...prev.junk_types, type],
    }));
  };

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="mb-2 text-2xl font-bold">Complete Your Profile</h1>
      <p className="text-gray-600 mb-6">
        Set up your services and submit verification documents to start
        receiving quotes.
      </p>

      {/* Verification notice */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Verification Required
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Your profile will not be visible to customers until your identity,
            business registration, and insurance documents have been reviewed
            and approved by our team. You can save your progress and come back.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.key === step;
          const isPast = i < stepIdx;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : isPast
                  ? "text-green-600 hover:bg-green-50"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      <Card>
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* ── STEP 1: Services ────────────────────────────── */}
        {step === "services" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              Service Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Cities
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add a city (press Enter)"
                  onKeyDown={(e) => {
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
                {serviceData.service_areas.map((city) => (
                  <Badge key={city} variant="info">
                    {city}
                    <button
                      type="button"
                      onClick={() => handleRemoveCity(city)}
                      className="ml-2 hover:text-red-600"
                    >
                      &times;
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
                      checked={serviceData.junk_types.includes(key)}
                      onChange={() => handleJunkTypeChange(key)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hourly Rate ($)"
                value={serviceData.hourly_rate}
                onChange={(e) =>
                  setServiceData((prev) => ({
                    ...prev,
                    hourly_rate: e.target.value,
                  }))
                }
                type="number"
                placeholder="e.g., 75"
              />
              <Input
                label="Crew Size"
                value={serviceData.crew_size}
                onChange={(e) =>
                  setServiceData((prev) => ({
                    ...prev,
                    crew_size: e.target.value,
                  }))
                }
                type="number"
                placeholder="e.g., 2"
              />
            </div>

            <Select
              label="Truck Size"
              value={serviceData.truck_size}
              onChange={(e) =>
                setServiceData((prev) => ({
                  ...prev,
                  truck_size: e.target.value,
                }))
              }
              options={[
                { value: "pickup", label: "Pickup Truck" },
                { value: "cargo_van", label: "Cargo Van" },
                { value: "cube_truck", label: "Cube Truck (10-16 ft)" },
                { value: "large_truck", label: "Large Truck (20+ ft)" },
                { value: "trailer", label: "Truck + Trailer" },
              ]}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="same_day"
                checked={serviceData.same_day_available}
                onChange={(e) =>
                  setServiceData((prev) => ({
                    ...prev,
                    same_day_available: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="same_day" className="text-sm text-gray-700">
                Same-day availability
              </label>
            </div>

            <Input
              label="Hours of Operation"
              value={serviceData.hours_of_operation}
              onChange={(e) =>
                setServiceData((prev) => ({
                  ...prev,
                  hours_of_operation: e.target.value,
                }))
              }
              placeholder="e.g., Mon-Fri 7am-6pm, Sat 8am-4pm"
            />

            <Textarea
              label="Disposal / Recycling Practices"
              value={serviceData.disposal_practices}
              onChange={(e) =>
                setServiceData((prev) => ({
                  ...prev,
                  disposal_practices: e.target.value,
                }))
              }
              placeholder="Describe how you handle disposal, recycling, and donations..."
            />

            <Textarea
              label="Bio"
              value={serviceData.bio}
              onChange={(e) =>
                setServiceData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell customers about your experience..."
            />

            <div className="flex justify-end">
              <Button type="button" onClick={goNext}>
                Next: Identity Verification
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Identity ────────────────────────────── */}
        {step === "identity" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              Identity Verification
            </h2>
            <p className="text-sm text-gray-500">
              We verify every provider&apos;s identity to protect customers and
              build trust. Your ID is reviewed by our team and never shared
              publicly.
            </p>

            <Input
              label="Legal Full Name (as on ID)"
              value={identityData.legal_full_name}
              onChange={(e) =>
                setIdentityData((prev) => ({
                  ...prev,
                  legal_full_name: e.target.value,
                }))
              }
              placeholder="First Middle Last"
            />

            <Input
              label="Date of Birth"
              type="date"
              value={identityData.date_of_birth}
              onChange={(e) =>
                setIdentityData((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
            />

            <Select
              label="ID Type"
              value={identityData.id_type}
              onChange={(e) =>
                setIdentityData((prev) => ({
                  ...prev,
                  id_type: e.target.value,
                }))
              }
              options={Object.entries(ID_TYPES).map(([value, label]) => ({
                value,
                label,
              }))}
            />

            <Input
              label="ID Expiry Date"
              type="date"
              value={identityData.id_expiry_date}
              onChange={(e) =>
                setIdentityData((prev) => ({
                  ...prev,
                  id_expiry_date: e.target.value,
                }))
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ID Document (photo or scan)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {idFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {idFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button type="button" onClick={goNext}>
                Next: Business Details
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Business ────────────────────────────── */}
        {step === "business" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              Business Registration
            </h2>
            <p className="text-sm text-gray-500">
              Registered businesses earn a trust badge and rank higher in
              customer results.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Legal Business Name"
                value={businessData.legal_business_name}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    legal_business_name: e.target.value,
                  }))
                }
                placeholder="As registered with the province"
              />
              <Input
                label="Operating Name (if different)"
                value={businessData.operating_name}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    operating_name: e.target.value,
                  }))
                }
                placeholder="DBA / trade name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Registration Number"
                value={businessData.business_registration_number}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    business_registration_number: e.target.value,
                  }))
                }
                placeholder="BN / HST number"
              />
              <Select
                label="Province of Registration"
                value={businessData.province_of_registration}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    province_of_registration: e.target.value,
                  }))
                }
                options={Object.entries(PROVINCES).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <Select
              label="Business Type"
              value={businessData.business_type}
              onChange={(e) =>
                setBusinessData((prev) => ({
                  ...prev,
                  business_type: e.target.value,
                }))
              }
              options={Object.entries(BUSINESS_TYPES).map(([value, label]) => ({
                value,
                label,
              }))}
            />

            <Input
              label="Business Address"
              value={businessData.business_address}
              onChange={(e) =>
                setBusinessData((prev) => ({
                  ...prev,
                  business_address: e.target.value,
                }))
              }
              placeholder="Full business address"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Phone"
                value={businessData.business_phone}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    business_phone: e.target.value,
                  }))
                }
                type="tel"
                placeholder="(905) 555-0123"
              />
              <Input
                label="Business Email"
                value={businessData.business_email}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    business_email: e.target.value,
                  }))
                }
                type="email"
                placeholder="billing@yourcompany.ca"
              />
            </div>

            <Input
              label="Website (optional)"
              value={businessData.business_website}
              onChange={(e) =>
                setBusinessData((prev) => ({
                  ...prev,
                  business_website: e.target.value,
                }))
              }
              placeholder="https://yourcompany.ca"
            />

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button type="button" onClick={goNext}>
                Next: Insurance
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Insurance ───────────────────────────── */}
        {step === "insurance" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              Insurance Details
            </h2>
            <p className="text-sm text-gray-500">
              Valid insurance is required to accept jobs. Providers with expired
              insurance are automatically hidden from the marketplace. We&apos;ll
              remind you before your coverage expires.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Insurer Name"
                value={insuranceData.insurer_name}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurer_name: e.target.value,
                  }))
                }
                placeholder="e.g., Intact Insurance"
              />
              <Input
                label="Policy Number"
                value={insuranceData.insurance_policy_number}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurance_policy_number: e.target.value,
                  }))
                }
                placeholder="Policy #"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Coverage Type"
                value={insuranceData.insurance_coverage_type}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurance_coverage_type: e.target.value,
                  }))
                }
                placeholder="e.g., General Liability"
              />
              <Input
                label="Coverage Amount ($)"
                value={insuranceData.insurance_coverage_amount}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurance_coverage_amount: e.target.value,
                  }))
                }
                type="number"
                placeholder="e.g., 2000000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Effective Date"
                type="date"
                value={insuranceData.insurance_effective_date}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurance_effective_date: e.target.value,
                  }))
                }
              />
              <Input
                label="Expiry Date"
                type="date"
                value={insuranceData.insurance_expiry_date}
                onChange={(e) =>
                  setInsuranceData((prev) => ({
                    ...prev,
                    insurance_expiry_date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Insurance Certificate
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setInsuranceFile(e.target.files?.[0] || null)
                }
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {insuranceFile && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: {insuranceFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button type="button" onClick={goNext}>
                Review & Submit
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Review ──────────────────────────────── */}
        {step === "review" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">
              Review & Submit
            </h2>
            <p className="text-sm text-gray-500">
              Review your information below. After submitting, our team will
              review your verification documents. You&apos;ll be notified once
              approved.
            </p>

            {/* Services summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  Services
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("services")}
                  className="text-sm text-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Areas:</span>{" "}
                  {serviceData.service_areas.join(", ") || "Not set"}
                </p>
                <p>
                  <span className="font-medium">Junk types:</span>{" "}
                  {serviceData.junk_types.length} selected
                </p>
                {serviceData.truck_size && (
                  <p>
                    <span className="font-medium">Truck:</span>{" "}
                    {serviceData.truck_size}
                  </p>
                )}
                {serviceData.crew_size && (
                  <p>
                    <span className="font-medium">Crew size:</span>{" "}
                    {serviceData.crew_size}
                  </p>
                )}
              </div>
            </div>

            {/* Identity summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Identity
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="text-sm text-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {identityData.legal_full_name || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">ID type:</span>{" "}
                  {identityData.id_type
                    ? (ID_TYPES as Record<string, string>)[identityData.id_type]
                    : "Not selected"}
                </p>
                <p>
                  <span className="font-medium">ID document:</span>{" "}
                  {idFile ? idFile.name : "Not uploaded"}
                </p>
              </div>
            </div>

            {/* Business summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  Business
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("business")}
                  className="text-sm text-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Business name:</span>{" "}
                  {businessData.legal_business_name || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Registration #:</span>{" "}
                  {businessData.business_registration_number || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Province:</span>{" "}
                  {businessData.province_of_registration
                    ? (PROVINCES as Record<string, string>)[
                        businessData.province_of_registration
                      ]
                    : "Not selected"}
                </p>
              </div>
            </div>

            {/* Insurance summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Insurance
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("insurance")}
                  className="text-sm text-green-600 hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Insurer:</span>{" "}
                  {insuranceData.insurer_name || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Policy #:</span>{" "}
                  {insuranceData.insurance_policy_number || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Expiry:</span>{" "}
                  {insuranceData.insurance_expiry_date || "Not provided"}
                </p>
                <p>
                  <span className="font-medium">Certificate:</span>{" "}
                  {insuranceFile ? insuranceFile.name : "Not uploaded"}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={goBack}>
                Back
              </Button>
              <Button type="button" loading={loading} onClick={handleSubmit}>
                Submit for Verification
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
