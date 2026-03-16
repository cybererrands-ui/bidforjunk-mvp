export type UserRole = "customer" | "provider" | "admin";
export type JobStatus =
  | "open"
  | "negotiating"
  | "locked"
  | "accepted"
  | "ready_for_dispatch"
  | "dispatched"
  | "in_progress"
  | "completed"
  | "pending_admin_release"
  | "released"
  | "cancelled"
  | "disputed";
export type OfferKind = "bid" | "counter" | "accept";
export type OfferStatus = "active" | "accepted" | "rejected" | "expired";
export type JunkType =
  | "furniture"
  | "appliances"
  | "electronics"
  | "yard_waste"
  | "construction"
  | "household"
  | "vehicles"
  | "other";
export type DisputeStatus = "open" | "resolved" | "cancelled";
export type ResolutionType =
  | "customer_refund"
  | "provider_payment"
  | "split"
  | "dismissed"
  | "price_adjusted"
  | "partial_refund"
  | "full_refund";
export type NotificationType =
  | "newJobAlert"
  | "newOfferAlert"
  | "offerAccepted"
  | "dispatchNotification"
  | "jobCompleteNotification";

// ── Database interface for Supabase client ─────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          role: UserRole;
          bio: string | null;
          phone_number: string | null;
          is_verified: boolean;
          verified_at: string | null;
          verification_document_url: string | null;
          is_suspended: boolean;
          suspended_reason: string | null;
          suspended_at: string | null;
          trial_ends_at: string | null;
          subscription_stripe_customer_id: string | null;
          subscription_active: boolean;
          subscription_ends_at: string | null;
          service_areas: string[];
          junk_types: JunkType[];
          vehicle_types: string[];
          hourly_rate: number | null;
          avg_rating: number | null;
          total_jobs_completed: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          // Identity verification (Phase 1 retrofit)
          legal_full_name: string | null;
          date_of_birth: string | null;
          id_type: string | null;
          id_expiry_date: string | null;
          id_document_url: string | null;
          id_verified: boolean;
          id_verified_at: string | null;
          id_rejection_note: string | null;
          // Business verification
          legal_business_name: string | null;
          operating_name: string | null;
          business_registration_number: string | null;
          province_of_registration: string | null;
          business_type: string | null;
          business_address: string | null;
          business_phone: string | null;
          business_email: string | null;
          business_website: string | null;
          business_verified: boolean;
          business_verified_at: string | null;
          business_rejection_note: string | null;
          // Insurance verification
          insurer_name: string | null;
          insurance_policy_number: string | null;
          insurance_coverage_type: string | null;
          insurance_coverage_amount: number | null;
          insurance_effective_date: string | null;
          insurance_expiry_date: string | null;
          insurance_certificate_url: string | null;
          insurance_verified: boolean;
          insurance_verified_at: string | null;
          insurance_rejection_note: string | null;
          insurance_expired: boolean;
          // Operations
          truck_size: string | null;
          crew_size: number | null;
          same_day_available: boolean;
          disposal_practices: string | null;
          hours_of_operation: string | null;
          // Additional provider fields
          years_in_business: number | null;
          payment_methods_accepted: string[];
          fleet_photos_urls: string[];
          // Subscription tier
          subscription_tier: string;
          monthly_quotes_used: number;
          monthly_quotes_reset_at: string | null;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          bio?: string | null;
          phone_number?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          verification_document_url?: string | null;
          is_suspended?: boolean;
          suspended_reason?: string | null;
          suspended_at?: string | null;
          trial_ends_at?: string | null;
          subscription_stripe_customer_id?: string | null;
          subscription_active?: boolean;
          subscription_ends_at?: string | null;
          service_areas?: string[];
          junk_types?: JunkType[];
          vehicle_types?: string[];
          hourly_rate?: number | null;
          avg_rating?: number | null;
          total_jobs_completed?: number;
          total_reviews?: number;
          deleted_at?: string | null;
          legal_full_name?: string | null;
          date_of_birth?: string | null;
          id_type?: string | null;
          id_expiry_date?: string | null;
          id_document_url?: string | null;
          id_verified?: boolean;
          legal_business_name?: string | null;
          operating_name?: string | null;
          business_registration_number?: string | null;
          province_of_registration?: string | null;
          business_type?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          business_website?: string | null;
          business_verified?: boolean;
          insurer_name?: string | null;
          insurance_policy_number?: string | null;
          insurance_coverage_type?: string | null;
          insurance_coverage_amount?: number | null;
          insurance_effective_date?: string | null;
          insurance_expiry_date?: string | null;
          insurance_certificate_url?: string | null;
          insurance_verified?: boolean;
          insurance_expired?: boolean;
          truck_size?: string | null;
          crew_size?: number | null;
          same_day_available?: boolean;
          disposal_practices?: string | null;
          hours_of_operation?: string | null;
          years_in_business?: number | null;
          payment_methods_accepted?: string[];
          fleet_photos_urls?: string[];
          subscription_tier?: string;
          monthly_quotes_used?: number;
          monthly_quotes_reset_at?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          bio?: string | null;
          phone_number?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          verification_document_url?: string | null;
          is_suspended?: boolean;
          suspended_reason?: string | null;
          suspended_at?: string | null;
          trial_ends_at?: string | null;
          subscription_stripe_customer_id?: string | null;
          subscription_active?: boolean;
          subscription_ends_at?: string | null;
          service_areas?: string[];
          junk_types?: JunkType[];
          vehicle_types?: string[];
          hourly_rate?: number | null;
          avg_rating?: number | null;
          total_jobs_completed?: number;
          total_reviews?: number;
          deleted_at?: string | null;
          legal_full_name?: string | null;
          date_of_birth?: string | null;
          id_type?: string | null;
          id_expiry_date?: string | null;
          id_document_url?: string | null;
          id_verified?: boolean;
          id_verified_at?: string | null;
          id_rejection_note?: string | null;
          legal_business_name?: string | null;
          operating_name?: string | null;
          business_registration_number?: string | null;
          province_of_registration?: string | null;
          business_type?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          business_website?: string | null;
          business_verified?: boolean;
          business_verified_at?: string | null;
          business_rejection_note?: string | null;
          insurer_name?: string | null;
          insurance_policy_number?: string | null;
          insurance_coverage_type?: string | null;
          insurance_coverage_amount?: number | null;
          insurance_effective_date?: string | null;
          insurance_expiry_date?: string | null;
          insurance_certificate_url?: string | null;
          insurance_verified?: boolean;
          insurance_verified_at?: string | null;
          insurance_rejection_note?: string | null;
          insurance_expired?: boolean;
          truck_size?: string | null;
          crew_size?: number | null;
          same_day_available?: boolean;
          disposal_practices?: string | null;
          hours_of_operation?: string | null;
          years_in_business?: number | null;
          payment_methods_accepted?: string[];
          fleet_photos_urls?: string[];
          subscription_tier?: string;
          monthly_quotes_used?: number;
          monthly_quotes_reset_at?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          description: string;
          location_city: string;
          location_city_slug: string;
          location_state: string;
          location_address: string;
          location_coordinates: string | null;
          junk_types: JunkType[];
          estimated_volume: string | null;
          budget_cents: number | null;
          preferred_time: string | null;
          photos_urls: string[];
          status: JobStatus;
          agreed_price_cents: number | null;
          final_offer_id: string | null;
          contact_released_at: string | null;
          agreement_accepted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          customer_id: string;
          title: string;
          description: string;
          location_city: string;
          location_city_slug: string;
          location_state: string;
          location_address: string;
          location_coordinates?: string | null;
          junk_types: JunkType[];
          estimated_volume?: string | null;
          budget_cents?: number | null;
          preferred_time?: string | null;
          photos_urls?: string[];
          status?: JobStatus;
          agreed_price_cents?: number | null;
          final_offer_id?: string | null;
          contact_released_at?: string | null;
          agreement_accepted_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          customer_id?: string;
          title?: string;
          description?: string;
          location_city?: string;
          location_city_slug?: string;
          location_state?: string;
          location_address?: string;
          location_coordinates?: string | null;
          junk_types?: JunkType[];
          estimated_volume?: string | null;
          budget_cents?: number | null;
          preferred_time?: string | null;
          photos_urls?: string[];
          status?: JobStatus;
          agreed_price_cents?: number | null;
          final_offer_id?: string | null;
          contact_released_at?: string | null;
          agreement_accepted_at?: string | null;
          deleted_at?: string | null;
        };
      };
      offers: {
        Row: {
          id: string;
          job_id: string;
          provider_id: string;
          customer_id: string;
          kind: OfferKind;
          status: OfferStatus;
          price_cents: number;
          notes: string | null;
          turn_number: number;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          provider_id: string;
          customer_id: string;
          kind: string;
          status: string;
          price_cents: number;
          notes?: string | null;
          turn_number?: number;
          expires_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          provider_id?: string;
          customer_id?: string;
          kind?: string;
          status?: string;
          price_cents?: number;
          notes?: string | null;
          turn_number?: number;
          expires_at?: string | null;
          deleted_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          job_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          sender_id: string;
          content: string;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          sender_id?: string;
          content?: string;
          deleted_at?: string | null;
        };
      };
      escrow_payments: {
        Row: {
          id: string;
          job_id: string;
          customer_id: string;
          provider_id: string;
          stripe_payment_intent_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          customer_id: string;
          provider_id: string;
          stripe_payment_intent_id: string;
          amount_cents: number;
          currency?: string;
          status: string;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          customer_id?: string;
          provider_id?: string;
          stripe_payment_intent_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          deleted_at?: string | null;
        };
      };
      confirmations: {
        Row: {
          id: string;
          job_id: string;
          provider_confirmed: boolean;
          provider_confirmed_at: string | null;
          customer_confirmed: boolean;
          customer_confirmed_at: string | null;
          deadline_at: string;
          auto_released: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          provider_confirmed?: boolean;
          provider_confirmed_at?: string | null;
          customer_confirmed?: boolean;
          customer_confirmed_at?: string | null;
          deadline_at: string;
          auto_released?: boolean;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          provider_confirmed?: boolean;
          provider_confirmed_at?: string | null;
          customer_confirmed?: boolean;
          customer_confirmed_at?: string | null;
          deadline_at?: string;
          auto_released?: boolean;
          deleted_at?: string | null;
        };
      };
      disputes: {
        Row: {
          id: string;
          job_id: string;
          opened_by_id: string;
          status: DisputeStatus;
          reason: string;
          resolution_type: ResolutionType | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          opened_by_id: string;
          status: string;
          reason: string;
          resolution_type?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          opened_by_id?: string;
          status?: string;
          reason?: string;
          resolution_type?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
        };
      };
      dispute_evidence: {
        Row: {
          id: string;
          dispute_id: string;
          uploaded_by_id: string;
          file_url: string;
          file_type: string | null;
          description: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          dispute_id: string;
          uploaded_by_id: string;
          file_url: string;
          file_type?: string | null;
          description?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          dispute_id?: string;
          uploaded_by_id?: string;
          file_url?: string;
          file_type?: string | null;
          description?: string | null;
          deleted_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          job_id: string;
          reviewer_id: string;
          recipient_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          reviewer_id: string;
          recipient_id: string;
          rating: number;
          comment?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          reviewer_id?: string;
          recipient_id?: string;
          rating?: number;
          comment?: string | null;
          deleted_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          provider_id: string;
          stripe_subscription_id: string;
          plan_name: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          provider_id: string;
          stripe_subscription_id: string;
          plan_name: string;
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          provider_id?: string;
          stripe_subscription_id?: string;
          plan_name?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          deleted_at?: string | null;
        };
      };
      provider_verifications: {
        Row: {
          id: string;
          provider_id: string;
          document_url: string;
          status: string;
          verified_by_id: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          provider_id: string;
          document_url: string;
          status: string;
          verified_by_id?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          provider_id?: string;
          document_url?: string;
          status?: string;
          verified_by_id?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          deleted_at?: string | null;
        };
      };
      dispatch_assignments: {
        Row: {
          id: string;
          job_id: string;
          provider_id: string;
          admin_id: string;
          assigned_at: string;
          scheduled_date: string | null;
          scheduled_time_start: string | null;
          scheduled_time_end: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          job_id: string;
          provider_id: string;
          admin_id: string;
          assigned_at?: string;
          scheduled_date?: string | null;
          scheduled_time_start?: string | null;
          scheduled_time_end?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          job_id?: string;
          provider_id?: string;
          admin_id?: string;
          assigned_at?: string;
          scheduled_date?: string | null;
          scheduled_time_start?: string | null;
          scheduled_time_end?: string | null;
          deleted_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          related_job_id: string | null;
          related_offer_id: string | null;
          read: boolean;
          read_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          message: string;
          related_job_id?: string | null;
          related_offer_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          related_job_id?: string | null;
          related_offer_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          deleted_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  open: ["negotiating", "cancelled"],
  negotiating: ["open", "locked", "cancelled"],
  locked: ["accepted", "cancelled"],
  accepted: ["ready_for_dispatch", "cancelled", "disputed"],
  ready_for_dispatch: ["dispatched", "cancelled"],
  dispatched: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed", "cancelled"],
  completed: ["released", "disputed", "pending_admin_release", "cancelled"],
  pending_admin_release: ["released", "disputed", "cancelled"],
  released: [],
  cancelled: [],
  disputed: ["released", "cancelled"],
};

export interface CurrentUser {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_verified: boolean;
  is_suspended: boolean;
  trial_ends_at: string | null;
  subscription_active: boolean;
}
