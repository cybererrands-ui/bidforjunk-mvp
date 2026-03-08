# BidForJunk MVP Architecture

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Authentication**: Supabase Auth
- **Payments**: Stripe (PaymentIntent with manual capture for escrow)
- **Email**: Resend
- **CAPTCHA**: Cloudflare Turnstile
- **Storage**: Supabase Storage

## Database Schema

### Core Tables

- **profiles**: User accounts with role, verification status, trial dates
- **jobs**: Job postings with location, junk types, photos
- **offers**: Unified bids and counter-offers (merged table, kind='bid'|'counter'|'accept')
- **escrow_payments**: Stripe PaymentIntent records for escrow hold
- **confirmations**: Dual completion confirmations with 72-hour deadline
- **disputes**: Dispute records with resolution tracking
- **dispute_evidence**: File uploads for dispute resolution
- **reviews**: Star ratings and feedback
- **subscriptions**: Provider subscription tracking
- **provider_verifications**: Background check status
- **dispatch_assignments**: Work assignment tracking
- **notifications**: Event notifications sent to users

### Enums

- `user_role`: customer, provider, admin
- `job_status`: 9 states (open, negotiating, locked, dispatched, in_progress, completed, released, cancelled, disputed)
- `offer_kind`: bid, counter, accept
- `offer_status`: active, accepted, rejected, expired
- `junk_type`: furniture, appliances, electronics, yard_waste, construction, household, vehicles, other
- `dispute_status`: open, resolved, cancelled
- `resolution_type`: customer_refund, provider_payment, split, dismissed
- `notification_type`: newJobAlert, newOfferAlert, offerAccepted, dispatchNotification, jobCompleteNotification

### RLS Policies

All tables have Row-Level Security enabled with policies for:
- Public data (jobs, reviews) readable by anyone
- User-owned data accessible only by that user or admin
- Admin-only operations protected by role checks

## Job State Machine

Valid state transitions defined in `VALID_TRANSITIONS`:

```
open → negotiating, cancelled
negotiating → open, locked, cancelled
locked → dispatched, cancelled
dispatched → in_progress, cancelled
in_progress → completed, disputed, cancelled
completed → released, disputed, cancelled
released → (terminal)
cancelled → (terminal)
disputed → released, cancelled
```

## Payment Flow

1. Customer posts job
2. Providers submit bids
3. Customer accepts an offer → job transitions to "locked"
4. Customer creates Stripe PaymentIntent (manual capture) for escrow
5. Work is performed (job → "in_progress")
6. Work completed (job → "completed")
7. Dual confirmation required within 72 hours:
   - Both parties confirm → Payment captured and released
   - Provider confirms, auto-release after 72h deadline
8. Job released to provider (job → "released")

## Bid Limits (Per Week)

- **Unverified providers**: 3 bids/week
- **Verified free**: 5 bids/week
- **Subscribed**: Unlimited

## Trial Periods

- **Launch cohort** (signups before 2026-03-04): 30-day trial
- **New signups**: 7-day trial

## Email Templates (5 Total)

1. **newJobAlert**: Notify providers of new jobs in their service areas
2. **newOfferAlert**: Notify customer of new offer received
3. **offerAccepted**: Notify provider that their offer was accepted
4. **dispatchNotification**: Notify provider of scheduled work
5. **jobCompleteNotification**: Notify customer that work is complete

## Project Structure

```
bidforjunk-mvp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Auth pages (signup, login, verify)
│   │   ├── (customer)/              # Customer pages (dashboard, jobs)
│   │   ├── (provider)/              # Provider pages (dashboard, jobs, onboarding)
│   │   ├── (admin)/                 # Admin pages (dashboard, disputes, verifications)
│   │   ├── api/                     # API routes (webhooks, CAPTCHA)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   └── page.tsx                 # Landing page
│   ├── actions/                     # Server actions
│   │   ├── jobs.ts
│   │   ├── offers.ts
│   │   ├── escrow.ts
│   │   ├── confirmations.ts
│   │   ├── disputes.ts
│   │   ├── dispatch.ts
│   │   ├── reviews.ts
│   │   ├── providers.ts
│   │   ├── admin.ts
│   │   └── analytics.ts
│   ├── lib/                         # Utilities and config
│   │   ├── supabase/               # Supabase clients
│   │   ├── types.ts                # TypeScript types
│   │   ├── constants.ts            # App constants
│   │   ├── utils.ts                # Helper functions
│   │   ├── stripe.ts               # Stripe utilities
│   │   ├── resend.ts               # Email templates
│   │   └── analytics.ts            # Analytics helpers
│   └── components/                  # Reusable components
│       ├── ui/                     # Base UI components
│       ├── layout/                 # Layout components (navbar, guards)
│       ├── jobs/                   # Job-related components
│       ├── providers/              # Provider components
│       └── admin/                  # Admin components
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Complete database schema
├── middleware.ts                    # Auth middleware
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

## Key Features

### Authentication & Authorization
- Supabase Auth with email/password
- Role-based access control (customer, provider, admin)
- Middleware-based route protection
- User suspension support

### Jobs & Bidding
- Job posting with photos, location, junk types
- Unlimited bidding for unverified providers (with limits)
- Bid/counter-offer negotiation flow
- State machine for job lifecycle

### Payments
- Stripe escrow with manual capture
- Payment intent held until completion confirmation
- 72-hour dual confirmation deadline with auto-release
- Refund on dispute resolution

### Verification & Trust
- Provider background check system
- Verification badge display
- Admin review and approval workflow
- User suspension for violations

### Disputes & Resolution
- Open disputes with evidence upload
- Admin resolution with multiple options
- Payment held during dispute
- Outcome-based refund or release

### Notifications
- 5 transactional email templates
- In-app notification tracking
- Email delivery via Resend

### Admin Dashboard
- Platform metrics and analytics
- User management
- Verification queue
- Dispute management
- Job and dispatch board

## Deployment

### Supabase Setup
1. Create project at supabase.com
2. Apply migration: `supabase db push`
3. Enable RLS on all tables (auto-enabled via migration)
4. Configure Storage buckets (auto-created via migration)

### Stripe Setup
1. Create Stripe account
2. Create webhook endpoint at `/api/webhooks/stripe`
3. Add signing secret to env vars
4. Test webhook delivery in Stripe dashboard

### Resend Setup
1. Create Resend account
2. Verify sending domain
3. Add API key to env vars

### Vercel Deployment
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Security Considerations

- All database access goes through RLS policies
- Sensitive operations use service role client only
- API routes validate user identity and permissions
- Stripe webhook signature verification
- CAPTCHA on signup for bot prevention
- Soft deletes via `deleted_at` column
- User suspension support for violations
