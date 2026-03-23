/**
 * Provider visibility rules and insurance expiry logic.
 *
 * A provider is visible publicly only if ALL are true:
 * - trial active OR subscription active
 * - verification approved (id + business + insurance)
 * - insurance valid (not expired)
 * - required profile fields complete
 * - not suspended
 */

export interface ProviderVisibilityData {
  // Subscription / trial
  trial_ends_at: string | null;
  subscription_active: boolean;
  subscription_tier: string | null;

  // Verification
  is_verified: boolean;
  id_verified: boolean;
  business_verified: boolean;
  insurance_verified: boolean;

  // Insurance
  insurance_expired: boolean;
  insurance_expiry_date: string | null;

  // Profile completeness
  service_areas: string[];
  display_name: string;

  // Suspension
  is_suspended: boolean;
}

export interface VisibilityResult {
  visible: boolean;
  reasons: string[];
}

/**
 * Check whether a provider should be visible in the marketplace.
 * Returns { visible, reasons } where reasons lists why they're hidden.
 */
export function checkProviderVisibility(
  provider: ProviderVisibilityData
): VisibilityResult {
  const reasons: string[] = [];

  // 1. Trial or subscription must be active (free tier always allowed)
  const trialActive =
    provider.trial_ends_at !== null &&
    new Date(provider.trial_ends_at) > new Date();
  const subscriptionActive = provider.subscription_active === true;
  const isFreeOrNullTier =
    !provider.subscription_tier || provider.subscription_tier === "free";

  // Free-tier providers are always allowed to participate (with quota limits
  // enforced separately in checkBidLimit). Paid tiers require either an
  // active trial or active subscription.
  if (!isFreeOrNullTier && !trialActive && !subscriptionActive) {
    reasons.push("No active trial or subscription");
  }

  // 2. All three verifications must be approved
  if (!provider.id_verified) {
    reasons.push("ID not verified");
  }
  if (!provider.business_verified) {
    reasons.push("Business not verified");
  }
  if (!provider.insurance_verified) {
    reasons.push("Insurance not verified");
  }

  // 3. Insurance must not be expired
  if (provider.insurance_expired) {
    reasons.push("Insurance expired");
  } else if (provider.insurance_expiry_date) {
    const expiry = new Date(provider.insurance_expiry_date);
    if (expiry <= new Date()) {
      reasons.push("Insurance expiry date has passed");
    }
  }

  // 4. Required profile fields must be complete
  if (!provider.display_name || provider.display_name.trim() === "") {
    reasons.push("Display name missing");
  }
  if (!provider.service_areas || provider.service_areas.length === 0) {
    reasons.push("No service areas configured");
  }

  // 5. Must not be suspended
  if (provider.is_suspended) {
    reasons.push("Account suspended");
  }

  return {
    visible: reasons.length === 0,
    reasons,
  };
}

/**
 * Calculate days until insurance expiry.
 * Returns negative number if already expired.
 */
export function daysUntilInsuranceExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if insurance is in a warning period (30, 14, 7, or 1 day).
 * Returns the warning threshold if within range, or null.
 */
export function getInsuranceWarningLevel(
  expiryDate: string | null
): 30 | 14 | 7 | 1 | null {
  const days = daysUntilInsuranceExpiry(expiryDate);
  if (days === null) return null;
  if (days <= 1 && days >= 0) return 1;
  if (days <= 7) return 7;
  if (days <= 14) return 14;
  if (days <= 30) return 30;
  return null;
}
