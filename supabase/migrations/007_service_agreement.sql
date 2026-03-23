-- Migration 007: Add agreement tracking to jobs
-- Records when customer reviewed and accepted the service agreement before contact release.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMP WITH TIME ZONE;
