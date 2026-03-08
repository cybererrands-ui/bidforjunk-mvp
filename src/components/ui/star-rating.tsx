"use client";

import { Star } from "lucide-react";
import React from "react";

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ rating, onRate, readonly = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            className={`${sizeMap[size]} ${
              (hoverRating || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}
