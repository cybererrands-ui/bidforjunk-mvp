-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('customer', 'provider', 'admin');
CREATE TYPE job_status AS ENUM ('open', 'negotiating', 'locked', 'dispatched', 'in_progress', 'completed', 'released', 'cancelled', 'disputed');
CREATE TYPE offer_kind AS ENUM ('bid', 'counter', 'accept');
CREATE TYPE offer_status AS ENUM ('active', 'accepted', 'rejected', 'expired');
CREATE TYPE junk_type AS ENUM ('furniture', 'appliances', 'electronics', 'yard_waste', 'construction', 'household', 'vehicles', 'other');
CREATE TYPE dispute_status AS ENUM ('open', 'resolved', 'cancelled');
CREATE TYPE resolution_type AS ENUM ('customer_refund', 'provider_payment', 'split', 'dismissed');
CREATE TYPE notification_type AS ENUM ('newJobAlert', 'newOfferAlert', 'offerAccepted', 'dispatchNotification', 'jobCompleteNotification');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  bio TEXT,
  phone_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_document_url TEXT,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspended_reason TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_stripe_customer_id TEXT,
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  service_areas TEXT[] DEFAULT '{}',
  junk_types TEXT[] DEFAULT '{}',
  vehicle_types TEXT[] DEFAULT '{}',
  hourly_rate INTEGER,
  avg_rating DECIMAL(3,2),
  total_jobs_completed INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_city_slug TEXT NOT NULL,
  location_state TEXT NOT NULL,
  location_address TEXT NOT NULL,
  location_coordinates POINT,
  junk_types junk_type[] NOT NULL,
  estimated_volume TEXT,
  photos_urls TEXT[] DEFAULT '{}',
  status job_status DEFAULT 'open',
  agreed_price_cents INTEGER,
  final_offer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind offer_kind NOT NULL DEFAULT 'bid',
  status offer_status DEFAULT 'active',
  price_cents INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Escrow Payments table
CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'requires_payment_method',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Confirmations table
CREATE TABLE confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  provider_confirmed BOOLEAN DEFAULT FALSE,
  provider_confirmed_at TIMESTAMP WITH TIME ZONE,
  customer_confirmed BOOLEAN DEFAULT FALSE,
  customer_confirmed_at TIMESTAMP WITH TIME ZONE,
  deadline_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_released BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Disputes table
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  opened_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status dispute_status DEFAULT 'open',
  reason TEXT NOT NULL,
  resolution_type resolution_type,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Dispute Evidence table
CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Provider Verifications table
CREATE TABLE provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by_id UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Dispatch Assignments table
CREATE TABLE dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_job_id UUID REFERENCES jobs(id),
  related_offer_id UUID REFERENCES offers(id),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can read public profiles" ON profiles
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs RLS
CREATE POLICY "Anyone can read open jobs" ON jobs
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Customers can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = customer_id AND role = 'customer')
  );

CREATE POLICY "Customers can update own jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = customer_id)
  );

-- Offers RLS
CREATE POLICY "Users can read offers" ON offers
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Providers can create offers" ON offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = provider_id AND role = 'provider')
  );

CREATE POLICY "Users can update own offers" ON offers
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = provider_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id)
  );

-- Escrow RLS
CREATE POLICY "Users can read own escrow" ON escrow_payments
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = customer_id) OR
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = provider_id)
  );
CREATE POLICY "System can manage escrow" ON escrow_payments
  FOR ALL USING (true);

-- Confirmations RLS
CREATE POLICY "Job participants can manage confirmations" ON confirmations
  FOR ALL USING (true);

-- Disputes RLS
CREATE POLICY "Users can read own disputes" ON disputes
  FOR SELECT USING (true);
CREATE POLICY "Users can create disputes" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = opened_by_id)
  );
CREATE POLICY "Admin can update disputes" ON disputes
  FOR UPDATE USING (true);

-- Dispute Evidence RLS
CREATE POLICY "Users can manage evidence" ON dispute_evidence
  FOR ALL USING (true);

-- Reviews RLS
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = reviewer_id)
  );

-- Subscriptions RLS
CREATE POLICY "System can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

-- Provider Verifications RLS
CREATE POLICY "Users can manage verifications" ON provider_verifications
  FOR ALL USING (true);

-- Dispatch RLS
CREATE POLICY "Users can manage dispatch" ON dispatch_assignments
  FOR ALL USING (true);

-- Notifications RLS
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = user_id)
  );
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('job-photos', 'job-photos', true),
  ('verification-docs', 'verification-docs', false),
  ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT DO NOTHING;
