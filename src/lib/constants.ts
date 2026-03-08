import { JunkType, JobStatus } from "@/lib/types";

export const JUNK_TYPES: Record<JunkType, string> = {
  furniture: "Furniture",
  appliances: "Appliances",
  electronics: "Electronics",
  yard_waste: "Yard Waste",
  construction: "Construction",
  household: "Household Items",
  vehicles: "Vehicles",
  other: "Other",
};

export const BID_LIMITS = {
  unverified: 3,
  verified_free: 5,
  subscribed: Infinity,
};

export const BID_LIMIT_PERIOD_DAYS = 7;

// Negotiation guardrails
export const MAX_NEGOTIATION_TURNS = 3; // Max 3 offer turns per side
export const OFFER_EXPIRY_HOURS = 24; // Offers expire after 24 hours

// Launch city (hardcoded for MVP)
export const LAUNCH_CITY = "Hamilton";
export const LAUNCH_STATE = "ON";
export const LAUNCH_COUNTRY = "CA";

// Trial cohort: Launch cohort (before March 4 2026) gets 30-day trial
const LAUNCH_COHORT_CUTOFF = new Date("2026-03-04");
export const getTrialDays = (signupDate: Date): number => {
  return signupDate < LAUNCH_COHORT_CUTOFF ? 30 : 7;
};

// Dual confirmation with 72-hour deadline
export const CONFIRMATION_DEADLINE_HOURS = 72;

// Silent-side admin release after 48 hours
export const SILENT_SIDE_RELEASE_HOURS = 48;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: "Open",
  negotiating: "Negotiating",
  locked: "Locked",
  escrow_authorized: "Escrow Authorized",
  ready_for_dispatch: "Ready for Dispatch",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  completed: "Completed",
  pending_admin_release: "Pending Admin Release",
  released: "Released",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  negotiating: "bg-yellow-100 text-yellow-800",
  locked: "bg-orange-100 text-orange-800",
  escrow_authorized: "bg-purple-100 text-purple-800",
  ready_for_dispatch: "bg-indigo-100 text-indigo-800",
  dispatched: "bg-violet-100 text-violet-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  pending_admin_release: "bg-amber-100 text-amber-800",
  released: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  disputed: "bg-red-100 text-red-800",
};

export const CURRENCY = "CAD";
export const CURRENCY_SYMBOL = "$";

export const BRAND_GREEN = "#16a34a";

export const EMAIL_TEMPLATES = {
  newJobAlert: "newJobAlert",
  newOfferAlert: "newOfferAlert",
  offerAccepted: "offerAccepted",
  dispatchNotification: "dispatchNotification",
  jobCompleteNotification: "jobCompleteNotification",
};

export const STRIPE_CAPTURE_METHOD = "manual" as const;

// Priority score weights for dispatcher ordering
export const PRIORITY_WEIGHTS = {
  subscription_active: 50,
  is_verified: 20,
  avg_rating_multiplier: 5,
  jobs_completed_multiplier: 1,
};
