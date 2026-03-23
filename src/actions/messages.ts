"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Detects attempts to share off-platform contact information.
 * Blocks phone numbers, email addresses, URLs, and social media handles.
 */
function containsContactInfo(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    // Normalize common obfuscation: "at" → "@", "dot" → "."
    .replace(/\b(at)\b/gi, "@")
    .replace(/\b(dot)\b/gi, ".");

  const patterns = [
    // Phone numbers (7+ digits, with optional separators)
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    // Digit sequences of 7+ (e.g. "call me 9059876543")
    /\d[\d\s\-().]{6,}\d/,
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    // URLs / websites
    /(?:https?:\/\/|www\.)[^\s]+/,
    // Domain-like patterns (e.g. "mysite.com", "contact.ca")
    /[a-zA-Z0-9-]+\.(com|ca|net|org|io|co|me|info|biz)\b/,
    // Social media handles / platforms
    /(?:instagram|facebook|fb|snapchat|snap|whatsapp|telegram|tiktok|twitter|x\.com|signal|venmo|cashapp|zelle|paypal|e-?transfer)[\s:@/]/i,
    // Explicit "@handle" patterns
    /@[a-zA-Z0-9_]{3,}/,
  ];

  return patterns.some((pattern) => pattern.test(normalized) || pattern.test(text));
}

export async function sendMessage(
  jobId: string,
  senderId: string,
  content: string
) {
  const supabase = await createClient();

  // Force session refresh so auth.uid() resolves correctly in RLS
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Verify senderId belongs to authenticated user (prevent spoofing)
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", senderId)
    .single();
  if (!senderProfile) throw new Error("Unauthorized sender");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message content cannot be empty");

  // Block messages containing contact info to prevent off-platform transactions
  if (containsContactInfo(trimmed)) {
    throw new Error(
      "For your protection, sharing contact information (phone numbers, emails, websites, or social media) is not allowed. All communication and payments must stay on BidForJunk."
    );
  }

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

  // Force session refresh so auth.uid() resolves correctly in RLS
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

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
