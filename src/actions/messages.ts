"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(
  jobId: string,
  senderId: string,
  content: string
) {
  const supabase = await createClient();

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message content cannot be empty");

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      job_id: jobId,
      sender_id: senderId,
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/customer/jobs/${jobId}`);
  revalidatePath(`/provider/jobs/${jobId}`);
  return message;
}

export async function getMessages(jobId: string) {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      job_id,
      sender_id,
      content,
      created_at,
      sender:profiles!messages_sender_id_fkey (
        id,
        display_name,
        avatar_url,
        role
      )
    `
    )
    .eq("job_id", jobId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Normalize Supabase joins (arrays → single objects)
  return (messages || []).map((msg: any) => ({
    ...msg,
    sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
  }));
}
