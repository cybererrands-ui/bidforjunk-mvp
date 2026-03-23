-- Migration 006: Security fixes + schema cleanup
-- 1. Fix admin signup vulnerability: prevent setting role='admin' from signup trigger
-- 2. Add missing columns (budget_cents, preferred_time, contact_released_at, turn_number, subscription_tier)
-- 3. Add new job statuses for the lead-and-match model
-- 4. Clean up

-- ── 1. Fix the handle_new_user trigger to block admin self-registration ──
--    Also set trial_ends_at for providers (7 days default, 30 for launch cohort)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  safe_role user_role;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');

  -- Only allow 'customer' or 'provider' from self-registration.
  -- Admin accounts must be created via direct DB update or admin API.
  IF requested_role NOT IN ('customer', 'provider') THEN
    safe_role := 'customer'::user_role;
  ELSE
    safe_role := requested_role::user_role;
  END IF;

  -- Calculate trial end for providers
  -- Launch cohort (before 2026-03-04) gets 30 days, rest get 7
  IF safe_role = 'provider' THEN
    IF NOW() < '2026-03-04'::timestamptz THEN
      trial_end := NOW() + INTERVAL '30 days';
    ELSE
      trial_end := NOW() + INTERVAL '7 days';
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, email, display_name, role, trial_ends_at, subscription_tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    safe_role,
    trial_end,
    CASE WHEN safe_role = 'provider' THEN 'free' ELSE NULL END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 2. Add missing job statuses if not present ──
-- Add new statuses that were added in the lead-and-match model
DO $$
BEGIN
  -- Add accepted status
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accepted' AND enumtypid = 'job_status'::regtype) THEN
    ALTER TYPE job_status ADD VALUE 'accepted';
  END IF;
  -- Add ready_for_dispatch status
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready_for_dispatch' AND enumtypid = 'job_status'::regtype) THEN
    ALTER TYPE job_status ADD VALUE 'ready_for_dispatch';
  END IF;
  -- Add pending_admin_release status
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_admin_release' AND enumtypid = 'job_status'::regtype) THEN
    ALTER TYPE job_status ADD VALUE 'pending_admin_release';
  END IF;
END $$;

-- ── 3. Add missing columns to jobs if not present ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'budget_cents') THEN
    ALTER TABLE jobs ADD COLUMN budget_cents INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'preferred_time') THEN
    ALTER TABLE jobs ADD COLUMN preferred_time TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'contact_released_at') THEN
    ALTER TABLE jobs ADD COLUMN contact_released_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ── 4. Add turn_number to offers if not present ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'turn_number') THEN
    ALTER TABLE offers ADD COLUMN turn_number INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'expires_at') THEN
    ALTER TABLE offers ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ── 5. Add resolution_type values if missing ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'price_adjusted' AND enumtypid = 'resolution_type'::regtype) THEN
    ALTER TYPE resolution_type ADD VALUE 'price_adjusted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'partial_refund' AND enumtypid = 'resolution_type'::regtype) THEN
    ALTER TYPE resolution_type ADD VALUE 'partial_refund';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'full_refund' AND enumtypid = 'resolution_type'::regtype) THEN
    ALTER TYPE resolution_type ADD VALUE 'full_refund';
  END IF;
END $$;

-- ── 6. Backfill trial_ends_at for existing providers who have NULL ──
-- Give existing providers a 30-day trial from now (launch cohort benefit)
UPDATE profiles
SET
  trial_ends_at = NOW() + INTERVAL '30 days',
  subscription_tier = COALESCE(subscription_tier, 'free')
WHERE role = 'provider'
  AND trial_ends_at IS NULL;

-- ── 7. Add useful indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_job_id ON offers(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_provider_id ON offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_active ON profiles(subscription_active);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
