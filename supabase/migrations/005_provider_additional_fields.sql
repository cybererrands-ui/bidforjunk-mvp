-- Migration 005: Add missing provider profile fields
-- years_in_business, payment_methods_accepted, fleet_photos_urls

-- Years in business (integer, e.g. 5)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_in_business INTEGER;

-- Payment methods accepted (text array, e.g. {"cash","e-transfer","credit_card"})
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_methods_accepted TEXT[] DEFAULT '{}';

-- Photos of truck / team (URL array, stored in Supabase Storage)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fleet_photos_urls TEXT[] DEFAULT '{}';
