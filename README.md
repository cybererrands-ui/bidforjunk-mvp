# BidForJunk MVP

A two-sided junk removal bidding marketplace built with Next.js 14, Supabase, Stripe, and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (escrow with manual capture)
- **Email**: Resend
- **CAPTCHA**: Cloudflare Turnstile
- **Storage**: Supabase Storage

## Features

- Customer job posting with photo uploads
- Provider bidding with service area/junk type filtering
- Dual-confirmation completion with 72-hour deadline
- Stripe escrow payments with manual capture/release
- Provider verification system
- Dispute resolution with evidence upload
- Review system
- Email notifications (5 templates)
- Admin dashboard with metrics and user management
- Tiered bid limits (Unverified: 3/wk, Verified free: 5/wk, Subscribed: unlimited)

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 2. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Copy the project URL and anon key to `.env.local`
3. Get the service role key from Project Settings > API > Service role key
4. Apply the database migration:
   ```bash
   cd supabase
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

### 3. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your publishable and secret keys from the dashboard
3. Create a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe`
4. Add the webhook signing secret to `.env.local`

### 4. Resend Setup

1. Create a Resend account at https://resend.com
2. Get your API key and add it to `.env.local`
3. Verify your sending domain

### 5. Turnstile Setup

1. Create a Cloudflare account and set up Turnstile
2. Add site key to `.env.local` and secret key to `.env.local`

### 6. Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start using the application.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy

### Database Migrations

Production database is automatically initialized with the migration in `supabase/migrations/001_initial_schema.sql`.

## Architecture

### Authentication Roles

- **Customer**: Posts jobs, pays for services
- **Provider**: Submits bids/offers, performs work
- **Admin**: Manages platform, disputes, verifications

### Job Status Workflow

1. `open` - Job posted, waiting for offers
2. `negotiating` - Customer and provider exchanging counter-offers
3. `locked` - Price agreed, waiting for escrow payment
4. `dispatched` - Work scheduled/assigned
5. `in_progress` - Work being performed
6. `completed` - Work finished, dual confirmation pending
7. `released` - Payment released to provider
8. `cancelled` - Job cancelled by customer
9. `disputed` - Payment disputed by one party

### Payment Flow

1. Job price agreed between customer and provider
2. Customer creates Stripe PaymentIntent (manual capture)
3. Payment held in escrow
4. Work completed and dual-confirmed
5. Provider confirmed completion or 72h auto-release
6. Payment captured and released to provider

## Database

Key tables:
- `profiles` - User profiles with role, verification status, trial dates
- `jobs` - Job postings with location, junk types, photos
- `offers` - Bids and counter-offers with kind field (bid/counter/accept)
- `escrow_payments` - Stripe PaymentIntent records
- `confirmations` - Dual completion confirmations
- `disputes` - Dispute records with evidence
- `reviews` - Star ratings and feedback
- `subscriptions` - Provider subscriptions
- `provider_verifications` - Background check status
- `dispatch_assignments` - Work assignment tracking
- `notifications` - Event notifications sent to users

## Support

For issues and questions, contact support@bidforjunk.com
