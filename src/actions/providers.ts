"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JunkType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(
  providerId: string,
  data: {
    service_areas: string[];
    junk_types: JunkType[];
    vehicle_types: string[];
    hourly_rate?: number;
    bio?: string;
  }
) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      service_areas: data.service_areas,
      junk_types: data.junk_types,
      vehicle_types: data.vehicle_types,
      hourly_rate: data.hourly_rate || null,
      bio: data.bio || null,
    })
    .eq("id", providerId);

  if (error) throw error;
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
