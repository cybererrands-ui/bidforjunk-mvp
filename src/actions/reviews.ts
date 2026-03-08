"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitReview(
  jobId: string,
  recipientId: string,
  rating: number,
  comment?: string
) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("job_id", jobId)
    .eq("reviewer_id", profile.id)
    .single();

  if (existing) throw new Error("Review already submitted");

  const { data: review, error } = await admin
    .from("reviews")
    .insert({
      job_id: jobId,
      reviewer_id: profile.id,
      recipient_id: recipientId,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) throw error;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("recipient_id", recipientId);

  if (reviews && reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length;

    await admin
      .from("profiles")
      .update({
        avg_rating: Math.round(avgRating * 100) / 100,
        total_reviews: reviews.length,
      })
      .eq("id", recipientId);
  }

  revalidatePath(`/customer/jobs/${jobId}`);
  return review;
}
