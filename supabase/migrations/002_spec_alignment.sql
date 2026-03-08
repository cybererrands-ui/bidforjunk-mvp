-- Migration 002: Align schema with full MVP spec
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- 1. Add missing job statuses to enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'escrow_authorized' AFTER 'locked';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'ready_for_dispatch' AFTER 'escrow_authorized';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'pending_admin_release' AFTER 'completed';

-- 2. Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_cents INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- 3. Add turn tracking and expiration to offers
ALTER TABLE offers ADD COLUMN IF NOT EXISTS turn_number INTEGER DEFAULT 1;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 4. Change escrow currency default from USD to CAD
ALTER TABLE escrow_payments ALTER COLUMN currency SET DEFAULT 'CAD';

-- 5. Create messages table for chat-based negotiation
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job participants can read messages" ON messages
  FOR SELECT USING (
    deleted_at IS NULL AND (
      -- Customer who owns the job
      EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = messages.job_id
        AND j.customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
      OR
      -- Provider who has an offer on the job
      EXISTS (
        SELECT 1 FROM offers o
        WHERE o.job_id = messages.job_id
        AND o.provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
      OR
      -- Admin
      EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Job participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = sender_id)
    AND (
      -- Customer who owns the job
      EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = messages.job_id
        AND j.customer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
      OR
      -- Provider who has an offer on the job
      EXISTS (
        SELECT 1 FROM offers o
        WHERE o.job_id = messages.job_id
        AND o.provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- 7. Add index for message queries
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_budget_cents ON jobs(budget_cents) WHERE budget_cents IS NOT NULL;

-- 8. Add resolution types to dispute_resolution enum
-- The existing resolution_type enum has: customer_refund, provider_payment, split, dismissed
-- We need price_adjusted, partial_refund, full_refund for the spec
DO $$
BEGIN
  ALTER TYPE resolution_type ADD VALUE IF NOT EXISTS 'price_adjusted';
  ALTER TYPE resolution_type ADD VALUE IF NOT EXISTS 'partial_refund';
  ALTER TYPE resolution_type ADD VALUE IF NOT EXISTS 'full_refund';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
