"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Card } from "@/components/ui/card";
import { submitReview } from "@/actions/reviews";

interface ReviewFormProps {
  jobId: string;
  recipientId: string;
  recipientName: string;
}

export function ReviewForm({ jobId, recipientId, recipientName }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitReview(jobId, recipientId, rating, comment);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-8">
        <p className="text-lg font-semibold mb-2">Thank you for your review!</p>
        <p className="text-gray-600">Your feedback helps improve our community</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-semibold mb-6">Review {recipientName}</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
          <StarRating rating={rating} onRate={setRating} size="lg" />
        </div>
        <Textarea
          label="Comment (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
        />
        <Button type="submit" loading={loading} className="w-full">
          Submit Review
        </Button>
      </form>
    </Card>
  );
}
