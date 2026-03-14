"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JunkType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(
  providerId: string,
  data: {
    // Services
    service_areas: string[];
    junk_types: JunkType[];
    vehicle_types: string[];
    hourly_rate?: number;
    bio?: string;
    crew_size?: number;
    truck_size?: string;
    same_day_available?: boolean;
    disposal_practices?: string;
    hours_of_operation?: string;
    // Identity
    legal_full_name?: string;
    date_of_birth?: string;
    id_type?: string;
    id_expiry_date?: string;
    id_document_url?: string;
    // Business
    legal_business_name?: string;
    operating_name?: string;
    business_registration_number?: string;
    province_of_registration?: string;
    business_type?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    business_website?: string;
    // Insurance
    insurer_name?: string;
    insurance_policy_number?: string;
    insurance_coverage_type?: string;
    insurance_coverage_amount?: number;
    insurance_effective_date?: string;
    insurance_expiry_date?: string;
    insurance_certificate_url?: string;
  }
) {
  const admin = createAdminClient();

  // Build the update object, only including fields that were provided
  const updatePayload: Record<string, unknown> = {
    service_areas: data.service_areas,
    junk_types: data.junk_types,
    vehicle_types: data.vehicle_types,
    hourly_rate: data.hourly_rate ?? null,
    bio: data.bio ?? null,
  };

  // Operations fields
  if (data.crew_size !== undefined) updatePayload.crew_size = data.crew_size;
  if (data.truck_size !== undefined) updatePayload.truck_size = data.truck_size;
  if (data.same_day_available !== undefined)
    updatePayload.same_day_available = data.same_day_available;
  if (data.disposal_practices !== undefined)
    updatePayload.disposal_practices = data.disposal_practices;
  if (data.hours_of_operation !== undefined)
    updatePayload.hours_of_operation = data.hours_of_operation;

  // Identity fields
  if (data.legal_full_name !== undefined)
    updatePayload.legal_full_name = data.legal_full_name;
  if (data.date_of_birth !== undefined)
    updatePayload.date_of_birth = data.date_of_birth;
  if (data.id_type !== undefined) updatePayload.id_type = data.id_type;
  if (data.id_expiry_date !== undefined)
    updatePayload.id_expiry_date = data.id_expiry_date;
  if (data.id_document_url !== undefined)
    updatePayload.id_document_url = data.id_document_url;

  // Business fields
  if (data.legal_business_name !== undefined)
    updatePayload.legal_business_name = data.legal_business_name;
  if (data.operating_name !== undefined)
    updatePayload.operating_name = data.operating_name;
  if (data.business_registration_number !== undefined)
    updatePayload.business_registration_number =
      data.business_registration_number;
  if (data.province_of_registration !== undefined)
    updatePayload.province_of_registration = data.province_of_registration;
  if (data.business_type !== undefined)
    updatePayload.business_type = data.business_type;
  if (data.business_address !== undefined)
    updatePayload.business_address = data.business_address;
  if (data.business_phone !== undefined)
    updatePayload.business_phone = data.business_phone;
  if (data.business_email !== undefined)
    updatePayload.business_email = data.business_email;
  if (data.business_website !== undefined)
    updatePayload.business_website = data.business_website;

  // Insurance fields
  if (data.insurer_name !== undefined)
    updatePayload.insurer_name = data.insurer_name;
  if (data.insurance_policy_number !== undefined)
    updatePayload.insurance_policy_number = data.insurance_policy_number;
  if (data.insurance_coverage_type !== undefined)
    updatePayload.insurance_coverage_type = data.insurance_coverage_type;
  if (data.insurance_coverage_amount !== undefined)
    updatePayload.insurance_coverage_amount = data.insurance_coverage_amount;
  if (data.insurance_effective_date !== undefined)
    updatePayload.insurance_effective_date = data.insurance_effective_date;
  if (data.insurance_expiry_date !== undefined)
    updatePayload.insurance_expiry_date = data.insurance_expiry_date;
  if (data.insurance_certificate_url !== undefined)
    updatePayload.insurance_certificate_url = data.insurance_certificate_url;

  const { error } = await admin
    .from("profiles")
    .update(updatePayload)
    .eq("id", providerId);

  if (error) throw error;

  // Also create/update a provider_verifications record if docs were uploaded
  if (data.id_document_url || data.insurance_certificate_url) {
    const { data: existing } = await admin
      .from("provider_verifications")
      .select("id")
      .eq("provider_id", providerId)
      .single();

    if (existing) {
      await admin
        .from("provider_verifications")
        .update({
          document_url: data.id_document_url || "",
          status: "pending",
        })
        .eq("provider_id", providerId);
    } else {
      await admin.from("provider_verifications").insert({
        provider_id: providerId,
        document_url: data.id_document_url || "",
        status: "pending",
      });
    }
  }

  revalidatePath("/provider/dashboard");
  return { completed: true };
}

export async function submitVerificationDocs(providerId: string, file: File) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const filename = `${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("verification-docs")
    .upload(`${providerId}/${filename}`, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("verification-docs").getPublicUrl(uploadData.path);

  const { data: existing } = await supabase
    .from("provider_verifications")
    .select("id")
    .eq("provider_id", providerId)
    .single();

  if (existing) {
    const { data: updated, error } = await admin
      .from("provider_verifications")
      .update({ document_url: publicUrl, status: "pending" })
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/provider/dashboard");
    return updated;
  } else {
    const { data: created, error } = await admin
      .from("provider_verifications")
      .insert({ provider_id: providerId, document_url: publicUrl, status: "pending" })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/provider/dashboard");
    return created;
  }
}
