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

// Trial cohort: Launch cohort (before March 4 2026) gets 30-day trial
const LAUNCH_COHORT_CUTOFF = new Date("2026-03-04");
export const getTrialDays = (signupDate: Date): number => {
  return signupDate < LAUNCH_COHORT_CUTOFF ? 30 : 7;
};

// Dual confirmation with 72-hour deadline
export const CONFIRMATION_DEADLINE_HOURS = 72;

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: "Open",
  negotiating: "Negotiating",
  locked: "Locked",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  completed: "Completed",
  released: "Released",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  negotiating: "bg-yellow-100 text-yellow-800",
  locked: "bg-orange-100 text-orange-800",
  dispatched: "bg-purple-100 text-purple-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  released: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  disputed: "bg-red-100 text-red-800",
};

export const CURRENCY = "USD";
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
