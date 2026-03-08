"use server";

import { createClient } from "@/lib/supabase/server";
import { JunkType, JobStatus, VALID_TRANSITIONS } from "@/lib/types";
import { slugifyCity } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createJob(
  customerId: string,
  data: {
    title: string;
    description: string;
    location_city: string;
    location_state: string;
    location_address: string;
    junk_types: JunkType[];
    estimated_volume?: string;
    photos_urls?: string[];
  }
) {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: customerId,
      title: data.title,
      description: data.description,
      location_city: data.location_city,
      location_city_slug: slugifyCity(data.location_city),
      location_state: data.location_state,
      location_address: data.location_address,
      junk_types: data.junk_types,
      estimated_volume: data.estimated_volume || null,
      photos_urls: data.photos_urls || [],
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/customer/dashboard");
  revalidatePath("/provider/jobs");
  return job;
}

export async function cancelJob(jobId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId);

  if (error) throw error;
  revalidatePath("/customer/dashboard");
}

export async function uploadJobPhotos(jobId: string, photos: File[]) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const uploadedUrls: string[] = [];

  for (const photo of photos) {
    const filename = `${Date.now()}-${photo.name}`;
    const { data, error } = await supabase.storage
      .from("job-photos")
      .upload(`${userData.user.id}/${jobId}/${filename}`, photo);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("job-photos").getPublicUrl(data.path);

    uploadedUrls.push(publicUrl);
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("photos_urls")
    .eq("id", jobId)
    .single();

  if (job) {
    const updatedPhotos = [...(job.photos_urls || []), ...uploadedUrls];
    await supabase.from("jobs").update({ photos_urls: updatedPhotos }).eq("id", jobId);
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  return uploadedUrls;
}

export async function transitionJobStatus(jobId: string, newStatus: JobStatus) {
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("Job not found");

  const currentStatus = job.status as JobStatus;
  const validTransitions = VALID_TRANSITIONS[currentStatus];

  if (!validTransitions.includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: newStatus })
    .eq("id", jobId);

  if (error) throw error;

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  return { status: newStatus };
}
