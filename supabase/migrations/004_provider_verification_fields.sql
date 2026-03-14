-- Migration 004: Add provider verification, business, and insurance fields
-- Run this in Supabase SQL Editor after previous migrations.
-- All fields are nullable or have defaults — zero breaking changes.

-- 1. Provider identity verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legal_full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_type TEXT; -- drivers_license, passport, provincial_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_expiry_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;

-- 2. Business details
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legal_business_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS operating_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_registration_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province_of_registration TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT; -- sole_proprietorship, corporation, partnership
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE;

-- 3. Insurance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurer_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_coverage_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_coverage_amount INTEGER; -- in cents
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_effective_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_certificate_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_expired BOOLEAN DEFAULT FALSE;

-- 4. Operations
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crew_size INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS truck_size TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS materials_handled TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prohibited_items TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS same_day_available BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disposal_practices TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hours_of_operation TEXT;

-- 5. Subscription tier (replaces binary subscription_active for bid limits)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_quotes_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_quotes_reset_at TIMESTAMP WITH TIME ZONE;

-- 6. Contact release tracking on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_released_at TIMESTAMP WITH TIME ZONE;

-- 7. Index for insurance expiry checks
CREATE INDEX IF NOT EXISTS idx_profiles_insurance_expiry
  ON profiles(insurance_expiry_date)
  WHERE role = 'provider' AND insurance_expiry_date IS NOT NULL;

-- 8. Index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON profiles(subscription_tier)
  WHERE role = 'provider';
