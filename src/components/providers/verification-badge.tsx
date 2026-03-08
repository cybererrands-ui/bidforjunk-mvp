import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
}

export function VerificationBadge({ isVerified }: VerificationBadgeProps) {
  if (!isVerified) return null;
  return (
    <Badge variant="success" className="flex items-center gap-1">
      <Check className="w-3 h-3" />
      Verified
    </Badge>
  );
}
