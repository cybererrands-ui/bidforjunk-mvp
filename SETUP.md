# BidForJunk MVP - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (test mode)
- Resend account (for emails)
- Cloudflare account (for Turnstile CAPTCHA)

## Step 1: Clone and Install

```bash
cd bidforjunk-mvp
npm install
```

## Step 2: Supabase Setup

### Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Copy your project URL and anon key

### Initialize Database

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push

# Create storage buckets (if not auto-created)
# Go to Supabase dashboard > Storage > Create bucket
# - job-photos (public)
# - verification-docs (private)
# - dispute-evidence (private)
```

### Get Service Role Key

1. Go to Supabase dashboard
2. Project Settings > API
3. Copy Service role secret key

## Step 3: Stripe Setup

### Create Stripe Account

1. Go to https://stripe.com
2. Create account and go to test mode dashboard

### Get API Keys

1. Go to API keys section
2. Copy publishable key (pk_test_...)
3. Copy secret key (sk_test_...)

### Create Webhook Endpoint

1. Go to Webhooks section
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
4. Copy signing secret

## Step 4: Resend Setup

### Create Account

1. Go to https://resend.com
2. Create account

### Verify Domain

1. Add and verify your domain
2. Copy API key

## Step 5: Turnstile Setup

### Create Turnstile Site

1. Go to https://dash.cloudflare.com
2. Create Turnstile site
3. Copy site key and secret key

## Step 6: Environment Variables

```bash
# Copy example to .env.local
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend
RESEND_API_KEY=re_xxx

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx
TURNSTILE_SECRET_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 7: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Step 8: Test the Application

### Create Test Accounts

1. Sign up as customer: http://localhost:3000/signup
2. Sign up as provider: http://localhost:3000/signup

### Test Workflows

1. **Customer**: Post a job
2. **Provider**: View and bid on job
3. **Customer**: Accept offer
4. **Test Payment**: Use Stripe test card `4242 4242 4242 4242`
5. **Provider**: Mark work in progress
6. **Customer**: Confirm completion
7. **System**: Automatically release payment after 72 hours or dual confirmation

## Development Tips

### View Supabase Data

1. Go to Supabase dashboard
2. Use SQL editor to query tables
3. Check logs for errors

### Test Stripe Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use the webhook signing secret from the output
```

### Debug RLS Policies

- RLS violations will show in Supabase logs
- Check row-level security policies in database
- Use Supabase dashboard to simulate queries

### Email Testing

- Resend shows sent emails in dashboard
- Check spam folder for test emails
- Use Resend test API key in development

## Deployment Checklist

- [ ] Set up production Supabase project
- [ ] Run migrations on production database
- [ ] Set up production Stripe account (live keys)
- [ ] Verify Resend domain
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Update webhook URLs to production
- [ ] Test end-to-end payment flow
- [ ] Set up admin user for moderation
- [ ] Configure email domain reputation

## Troubleshooting

### "Connection refused" errors
- Check Supabase URL is correct
- Verify service role key is set for admin operations
- Check RLS policies allow the operation

### Stripe errors
- Verify API keys are for test mode
- Check webhook endpoint is accessible
- Use Stripe logs to debug payment issues

### Email not sending
- Check Resend API key
- Verify sender domain is verified
- Look for invalid email addresses in queue

### Authentication issues
- Clear browser cookies
- Check Supabase auth session
- Verify JWT is valid in local storage

## Next Steps

1. Customize branding and colors
2. Add more junk types if needed
3. Implement advanced search and filtering
4. Add provider ratings and reviews display
5. Set up analytics tracking
6. Create admin dashboard for platform metrics
7. Implement mobile app version
