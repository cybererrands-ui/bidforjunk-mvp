import {
  Shield,
  Building2,
  FileCheck,
  Zap,
  Clock,
  Leaf,
  Star,
  Truck,
  Home,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                               */
/* ------------------------------------------------------------------ */

export interface TrustBadgeData {
  // Verification status
  id_verified?: boolean;
  business_verified?: boolean;
  insurance_verified?: boolean;

  // Performance
  avg_rating?: number | null;
  total_jobs_completed?: number;

  // Operations
  same_day_available?: boolean;
  disposal_practices?: string | null;
  truck_size?: string | null;

  // Capabilities
  junk_types?: string[];
}

interface BadgeConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string; // tailwind bg + text classes
  show: (data: TrustBadgeData) => boolean;
}

/* ------------------------------------------------------------------ */
/*  BADGE DEFINITIONS                                                   */
/* ------------------------------------------------------------------ */

const BADGE_CONFIGS: BadgeConfig[] = [
  {
    key: "verified_id",
    label: "Verified ID",
    icon: Shield,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    show: (d) => d.id_verified === true,
  },
  {
    key: "registered_business",
    label: "Registered Business",
    icon: Building2,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    show: (d) => d.business_verified === true,
  },
  {
    key: "insurance_verified",
    label: "Insurance Verified",
    icon: FileCheck,
    color: "bg-green-50 text-green-700 border-green-200",
    show: (d) => d.insurance_verified === true,
  },
  {
    key: "top_rated",
    label: "Top Rated",
    icon: Star,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    show: (d) =>
      d.avg_rating !== undefined && d.avg_rating !== null && d.avg_rating >= 4.5,
  },
  {
    key: "fast_responder",
    label: "Fast Responder",
    icon: Zap,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    // For now, show for providers with 5+ jobs
    show: (d) =>
      d.total_jobs_completed !== undefined && d.total_jobs_completed >= 5,
  },
  {
    key: "same_day",
    label: "Same-Day Available",
    icon: Clock,
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    show: (d) => d.same_day_available === true,
  },
  {
    key: "eco_disposal",
    label: "Eco Disposal",
    icon: Leaf,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    show: (d) =>
      !!d.disposal_practices &&
      d.disposal_practices.length > 10, // Has meaningful disposal info
  },
  {
    key: "commercial_ready",
    label: "Commercial Ready",
    icon: Truck,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    show: (d) =>
      d.truck_size === "cube_truck" ||
      d.truck_size === "large_truck" ||
      d.truck_size === "trailer",
  },
  {
    key: "residential_ready",
    label: "Residential Ready",
    icon: Home,
    color: "bg-rose-50 text-rose-700 border-rose-200",
    show: (d) =>
      !!d.junk_types &&
      (d.junk_types.includes("furniture") ||
        d.junk_types.includes("household") ||
        d.junk_types.includes("appliances")),
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENTS                                                          */
/* ------------------------------------------------------------------ */

/** Individual trust badge pill */
function TrustBadgePill({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** Render all applicable trust badges for a provider */
export function TrustBadges({
  data,
  maxBadges,
  size = "sm",
}: {
  data: TrustBadgeData;
  maxBadges?: number;
  size?: "sm" | "md";
}) {
  const activeBadges = BADGE_CONFIGS.filter((b) => b.show(data));

  if (activeBadges.length === 0) return null;

  const displayBadges = maxBadges
    ? activeBadges.slice(0, maxBadges)
    : activeBadges;
  const remaining = activeBadges.length - displayBadges.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge) => (
        <TrustBadgePill
          key={badge.key}
          label={badge.label}
          icon={badge.icon}
          color={badge.color}
        />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

/** Compact verification badges row — just the core three */
export function CoreVerificationBadges({
  idVerified,
  businessVerified,
  insuranceVerified,
}: {
  idVerified: boolean;
  businessVerified: boolean;
  insuranceVerified: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {idVerified && (
        <TrustBadgePill
          label="Verified ID"
          icon={Shield}
          color="bg-blue-50 text-blue-700 border-blue-200"
        />
      )}
      {businessVerified && (
        <TrustBadgePill
          label="Registered Business"
          icon={Building2}
          color="bg-indigo-50 text-indigo-700 border-indigo-200"
        />
      )}
      {insuranceVerified && (
        <TrustBadgePill
          label="Insurance Verified"
          icon={FileCheck}
          color="bg-green-50 text-green-700 border-green-200"
        />
      )}
    </div>
  );
}
