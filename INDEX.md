# BidForJunk MVP - Complete Project Index

## Quick Navigation

### Getting Started
- [README.md](README.md) - Project overview and features
- [SETUP.md](SETUP.md) - Step-by-step setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture and design decisions

### Configuration
- [package.json](package.json) - Dependencies and npm scripts
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [tailwind.config.ts](tailwind.config.ts) - Tailwind CSS theme with brand colors
- [next.config.js](next.config.js) - Next.js configuration
- [.env.example](.env.example) - Environment variables template
- [middleware.ts](middleware.ts) - Auth and role-based routing middleware

### Database
- [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)
  - Complete PostgreSQL schema with 11 tables
  - 5 enum types (user_role, job_status, etc.)
  - Row-Level Security policies on all tables
  - Triggers for automatic timestamps
  - Storage bucket creation

### Frontend App Structure

#### Root Layout
- [src/app/layout.tsx](src/app/layout.tsx) - Root layout with Inter font
- [src/app/globals.css](src/app/globals.css) - Global styles and Tailwind directives
- [src/app/page.tsx](src/app/page.tsx) - Landing page with features and CTA

#### Authentication
- [src/app/(auth)/signup/page.tsx](src/app/(auth)/signup/page.tsx) - Role selection and registration
- [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx) - Email/password login
- [src/app/(auth)/verify/page.tsx](src/app/(auth)/verify/page.tsx) - Email verification confirmation

#### Customer Role
- [src/app/(customer)/layout.tsx](src/app/(customer)/layout.tsx) - Customer layout with navbar
- [src/app/(customer)/dashboard/page.tsx](src/app/(customer)/dashboard/page.tsx) - Job dashboard
- [src/app/(customer)/jobs/new/page.tsx](src/app/(customer)/jobs/new/page.tsx) - Create job form
- [src/app/(customer)/jobs/[id]/page.tsx](src/app/(customer)/jobs/[id]/page.tsx) - Job detail and offers

#### Provider Role
- [src/app/(provider)/layout.tsx](src/app/(provider)/layout.tsx) - Provider layout
- [src/app/(provider)/onboarding/page.tsx](src/app/(provider)/onboarding/page.tsx) - Profile setup
- [src/app/(provider)/dashboard/page.tsx](src/app/(provider)/dashboard/page.tsx) - Provider dashboard
- [src/app/(provider)/jobs/page.tsx](src/app/(provider)/jobs/page.tsx) - Available jobs board
- [src/app/(provider)/jobs/[id]/page.tsx](src/app/(provider)/jobs/[id]/page.tsx) - Job detail with bidding

#### Admin Role
- [src/app/(admin)/layout.tsx](src/app/(admin)/layout.tsx) - Admin layout
- [src/app/(admin)/dashboard/page.tsx](src/app/(admin)/dashboard/page.tsx) - Metrics overview
- [src/app/(admin)/jobs/page.tsx](src/app/(admin)/jobs/page.tsx) - All jobs view
- [src/app/(admin)/disputes/page.tsx](src/app/(admin)/disputes/page.tsx) - Dispute management
- [src/app/(admin)/verifications/page.tsx](src/app/(admin)/verifications/page.tsx) - Provider verification queue
- [src/app/(admin)/users/page.tsx](src/app/(admin)/users/page.tsx) - User management
- [src/app/(admin)/dispatch/page.tsx](src/app/(admin)/dispatch/page.tsx) - Dispatch board

### API Routes
- [src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)
  - Stripe webhook handler for payments, refunds, subscriptions
- [src/app/api/captcha/route.ts](src/app/api/captcha/route.ts)
  - Cloudflare Turnstile CAPTCHA verification

### Server Actions (Business Logic)
- [src/actions/jobs.ts](src/actions/jobs.ts)
  - `createJob()` - Post new job
  - `cancelJob()` - Cancel job
  - `uploadJobPhotos()` - Upload photos to Supabase Storage
  - `transitionJobStatus()` - Validate and transition job status

- [src/actions/offers.ts](src/actions/offers.ts)
  - `checkBidLimit()` - Check weekly bid limits
  - `submitOffer()` - Submit bid or counter-offer
  - `acceptOffer()` - Accept offer and lock price

- [src/actions/escrow.ts](src/actions/escrow.ts)
  - `createEscrowPayment()` - Create Stripe PaymentIntent
  - `releaseEscrow()` - Capture payment and release to provider
  - `cancelEscrow()` - Cancel/void payment
  - `refundEscrowPayment()` - Refund payment

- [src/actions/confirmations.ts](src/actions/confirmations.ts)
  - `confirmCompletion()` - Dual confirmation (customer/provider)
  - `autoReleaseEscrow()` - Auto-release after 72h deadline

- [src/actions/disputes.ts](src/actions/disputes.ts)
  - `openDispute()` - Open dispute with reason
  - `uploadDisputeEvidence()` - Upload evidence files
  - `resolveDispute()` - Admin resolution with outcome

- [src/actions/dispatch.ts](src/actions/dispatch.ts)
  - `assignDispatch()` - Admin assigns job to provider
  - `markInProgress()` - Provider marks work started

- [src/actions/reviews.ts](src/actions/reviews.ts)
  - `submitReview()` - Submit star rating and comment

- [src/actions/providers.ts](src/actions/providers.ts)
  - `completeOnboarding()` - Setup service areas and specialties
  - `submitVerificationDocs()` - Upload background check docs

- [src/actions/admin.ts](src/actions/admin.ts)
  - `reviewVerification()` - Approve/reject verification
  - `suspendUser()` - Suspend user account
  - `unsuspendUser()` - Reactivate account
  - `getAdminMetrics()` - Get platform metrics

- [src/actions/analytics.ts](src/actions/analytics.ts)
  - `getAnalyticsData()` - Get user-specific analytics

### Core Libraries

#### Types & Constants
- [src/lib/types.ts](src/lib/types.ts)
  - All TypeScript interfaces and types
  - User/Job/Offer/Dispute enums
  - Database type definitions
  - `VALID_TRANSITIONS` state machine
  - `CurrentUser` interface

- [src/lib/constants.ts](src/lib/constants.ts)
  - `JUNK_TYPES` enum with labels
  - `BID_LIMITS` for unverified/verified/subscribed
  - Trial day calculations
  - `JOB_STATUS_LABELS` and `JOB_STATUS_COLORS`
  - Email template names
  - Brand color definitions

#### Utilities
- [src/lib/utils.ts](src/lib/utils.ts)
  - `cn()` - Tailwind classname merge utility
  - `formatCurrency()` - Format cents to USD
  - `formatDate()` - Format ISO date
  - `timeAgo()` - Relative time formatting
  - `slugifyCity()` - City name normalization
  - `normalizeCityName()` - Lowercase city normalization

- [src/lib/stripe.ts](src/lib/stripe.ts)
  - `createEscrowHold()` - Create PaymentIntent
  - `captureEscrow()` - Capture payment
  - `voidEscrow()` - Cancel payment authorization
  - `refundEscrow()` - Issue refund
  - `createSubscriptionCheckout()` - Subscription session
  - `constructWebhookEvent()` - Verify webhook signature
  - `getPaymentIntent()` - Retrieve payment status

- [src/lib/resend.ts](src/lib/resend.ts)
  - `sendNewJobAlert()` - Email to providers
  - `sendNewOfferAlert()` - Email to customer
  - `sendOfferAccepted()` - Email to provider
  - `sendDispatchNotification()` - Email to provider
  - `sendJobCompleteNotification()` - Email to customer

- [src/lib/analytics.ts](src/lib/analytics.ts)
  - `trackEvent()` - Track analytics event
  - `trackPageView()` - Track page view
  - `trackButtonClick()` - Track button clicks
  - `trackFormSubmit()` - Track form submissions

#### Supabase Clients
- [src/lib/supabase/browser.ts](src/lib/supabase/browser.ts)
  - Browser-side Supabase client
  - Used in client components

- [src/lib/supabase/server.ts](src/lib/supabase/server.ts)
  - Server-side Supabase client
  - Used in Server Components and Actions

- [src/lib/supabase/admin.ts](src/lib/supabase/admin.ts)
  - Admin Supabase client (service role)
  - For privileged operations only

### UI Components

#### Base Components
- [src/components/ui/button.tsx](src/components/ui/button.tsx)
  - Variants: primary, secondary, danger, outline
  - Sizes: sm, md, lg
  - Loading state

- [src/components/ui/input.tsx](src/components/ui/input.tsx)
  - Text input with optional label and error message

- [src/components/ui/textarea.tsx](src/components/ui/textarea.tsx)
  - Textarea with optional label and error message

- [src/components/ui/select.tsx](src/components/ui/select.tsx)
  - Select dropdown with options

- [src/components/ui/card.tsx](src/components/ui/card.tsx)
  - Card container
  - Subcomponents: CardHeader, CardTitle, CardContent, CardFooter

- [src/components/ui/badge.tsx](src/components/ui/badge.tsx)
  - Status badge with variants

- [src/components/ui/modal.tsx](src/components/ui/modal.tsx)
  - Modal dialog with title and close button

- [src/components/ui/star-rating.tsx](src/components/ui/star-rating.tsx)
  - Interactive star rating (read-only or editable)

#### Layout Components
- [src/components/layout/navbar.tsx](src/components/layout/navbar.tsx)
  - Navigation bar with role-based links
  - Mobile menu support
  - Logout button

- [src/components/layout/role-guard.tsx](src/components/layout/role-guard.tsx)
  - `getCurrentUser()` - Get authenticated user
  - `requireAuth()` - Protect routes requiring auth
  - `requireRole()` - Protect routes by role
  - `requireAdmin()`, `requireProvider()`, `requireCustomer()` - Specific role shortcuts

#### Job Components
- [src/components/jobs/job-card.tsx](src/components/jobs/job-card.tsx)
  - Job listing card with status and price

- [src/components/jobs/job-status-badge.tsx](src/components/jobs/job-status-badge.tsx)
  - Colored status badge for job state

- [src/components/jobs/offer-thread.tsx](src/components/jobs/offer-thread.tsx)
  - Display bid/offer history
  - Accept/reject buttons for customer

- [src/components/jobs/escrow-pay-button.tsx](src/components/jobs/escrow-pay-button.tsx)
  - Modal to initiate escrow payment

- [src/components/jobs/confirm-button.tsx](src/components/jobs/confirm-button.tsx)
  - Modal for dual completion confirmation

- [src/components/jobs/dispute-button.tsx](src/components/jobs/dispute-button.tsx)
  - Modal to open dispute with reason

- [src/components/jobs/review-form.tsx](src/components/jobs/review-form.tsx)
  - Star rating and comment submission

#### Provider Components
- [src/components/providers/verification-badge.tsx](src/components/providers/verification-badge.tsx)
  - Display verification status

#### Admin Components
- [src/components/admin/metrics-card.tsx](src/components/admin/metrics-card.tsx)
  - Display metric with optional change indicator

- [src/components/admin/dispatch-card.tsx](src/components/admin/dispatch-card.tsx)
  - Display dispatch assignment

### Documentation
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Detailed setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture and design
- [FILES_MANIFEST.md](FILES_MANIFEST.md) - Complete file listing
- [BUILD_SUMMARY.txt](BUILD_SUMMARY.txt) - Build summary
- [INDEX.md](INDEX.md) - This file

---

## Key Statistics

- **Total Files**: 78
- **TypeScript Files**: 60+
- **Database Tables**: 11
- **Enum Types**: 5
- **User Roles**: 3 (customer, provider, admin)
- **Job Statuses**: 9
- **UI Components**: 8 base + 12 specialized
- **Server Actions**: 10 files with 30+ functions
- **Email Templates**: 5
- **Lines of Code**: 10,000+

## File Organization

```
bidforjunk-mvp/
├── Configuration & Build
├── Database & Migrations
├── Frontend App (Next.js App Router)
├── API Routes
├── Server Actions
├── Libraries & Utilities
└── Components (UI, Layout, Feature-specific)
```

---

## Development Workflow

### Adding a Feature
1. Create server action in `src/actions/`
2. Create component in `src/components/` if needed
3. Create/update page in `src/app/` to use action
4. Update types in `src/lib/types.ts` if needed
5. Test with Supabase and Stripe test mode

### Adding a Page
1. Create page in appropriate role folder under `src/app/`
2. Use `requireRole()` for access control
3. Create components and server actions as needed
4. Add navigation link in navbar

### Database Changes
1. Create migration in `supabase/migrations/`
2. Run: `supabase db push`
3. Update `Database` type in `src/lib/types.ts`
4. Update RLS policies if needed

---

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

Last Updated: March 4, 2026
Project Status: Production-Ready MVP
