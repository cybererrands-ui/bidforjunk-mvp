import Link from "next/link";
import {
  Check,
  ArrowRight,
  Shield,
  TrendingUp,
  Zap,
  Crown,
  Star,
  BadgeCheck,
  Truck,
  ChevronDown,
} from "lucide-react";
import { CheckoutButton } from "@/components/providers/checkout-button";

/* ------------------------------------------------------------------ */
/*  DATA                                                                */
/* ------------------------------------------------------------------ */

const plans = [
  {
    tier: "starter" as const,
    name: "Starter",
    price: 45,
    tagline: "For solo haulers ready to grow",
    quoteCap: "15 quotes / month",
    icon: Zap,
    features: [
      "Listed in your local service area",
      "Access to local quote opportunities",
      "Up to 15 quote submissions per month",
      "Verified provider badge after approval",
      "Basic performance dashboard",
      "Standard placement in results",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    tier: "growth" as const,
    name: "Growth",
    price: 78,
    tagline: "For active operators winning more jobs",
    quoteCap: "60 quotes / month",
    icon: TrendingUp,
    features: [
      "Everything in Starter",
      "Up to 60 quote submissions per month",
      "Improved placement in results",
      "Priority job notifications",
      "In-app messaging tools",
      "Performance insights & analytics",
      "Stronger trust positioning",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    tier: "dominator" as const,
    name: "Dominator",
    price: 288,
    tagline: "For serious operators who own their market",
    quoteCap: "Unlimited quotes",
    icon: Crown,
    features: [
      "Everything in Growth",
      "Unlimited quote submissions",
      "Top local placement",
      "Premium profile exposure",
      "Commercial-ready positioning",
      "Enhanced profile branding",
      "Premium analytics dashboard",
      "Multi-area dominance support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

const roiPoints = [
  {
    stat: "$250\u2013$800+",
    label: "Average junk removal job in Hamilton",
  },
  {
    stat: "1 job",
    label: "One booked job covers your entire month",
  },
  {
    stat: "100%",
    label: "Of your leads are local, verified buyers",
  },
];

const objections = [
  {
    q: "Why pay monthly when I already get leads from Facebook?",
    a: "Facebook leads are tire-kickers browsing their feed. BidForJunk leads are homeowners who already described their junk, set a budget, and are waiting for quotes. These are buyers, not browsers. One booked job pays for months of your plan.",
  },
  {
    q: "What if I'm a small operator \u2014 is this worth it?",
    a: "The Starter plan is built for solo haulers. At $45/month, you need to book just one small job to cover the cost. Meanwhile, you build a verified profile with reviews that compounds over time. The earlier you start, the stronger your position when competition arrives.",
  },
  {
    q: "What if I don't get enough value?",
    a: "Cancel anytime. No contracts. No cancellation fees. Your profile history stays. If the platform isn't delivering leads in your area, you're never locked in. But operators who show up first and build reviews tend to win the most.",
  },
  {
    q: "Why act now instead of later?",
    a: "Early launch providers get a 30-day free trial (instead of the standard 7 days). Hamilton is our launch market and the first providers to build reviews and badges here will own the local results. Waiting means competing against established profiles.",
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENTS                                                          */
/* ------------------------------------------------------------------ */

function PricingHero() {
  return (
    <section className="bg-gradient-to-br from-green-50 via-white to-green-50 pt-20 pb-16">
      {/* Nav */}
      <header className="max-w-7xl mx-auto px-6 pb-12 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-green-600 tracking-tight"
        >
          BidForJunk
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Sign Up
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Stop Chasing Leads.<br />
          Start Receiving Them.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Homeowners in Hamilton are posting junk removal jobs right now.
          Get verified, show up first, and win the work — before your competition does.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            Free trial included
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" />
            Verification required before visibility
          </span>
        </div>
      </div>
    </section>
  );
}

function ROISection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-4">
          One Booked Job Pays for Itself
        </h2>
        <p className="text-center text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
          These aren't cold leads from ads. These are homeowners who described
          their junk, set a budget, and are ready to hire.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {roiPoints.map((item) => (
            <div
              key={item.label}
              className="text-center p-6 rounded-xl bg-green-50"
            >
              <p className="text-3xl md:text-4xl font-extrabold text-green-700">
                {item.stat}
              </p>
              <p className="mt-2 text-gray-600 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCards() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-center text-gray-500 text-lg mb-14 max-w-2xl mx-auto">
          All plans include a free trial. Verification is required before your
          profile goes live. Transparent pricing — no hidden fees.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.tier}
                className={`relative rounded-2xl bg-white shadow-sm border-2 p-8 flex flex-col ${
                  plan.highlighted
                    ? "border-green-500 shadow-lg shadow-green-100 scale-[1.02]"
                    : "border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      plan.highlighted
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">{plan.tagline}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500 ml-1">/ month</span>
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    {plan.quoteCap}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <CheckoutButton
                  tier={plan.tier}
                  label={plan.cta}
                  highlighted={plan.highlighted}
                />
              </div>
            );
          })}
        </div>

        {/* Free tier note */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Not ready to commit?{" "}
            <Link
              href="/signup"
              className="text-green-600 font-semibold hover:underline"
            >
              Create a free account
            </Link>{" "}
            — verified free providers can submit up to 5 quotes per week.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-12">
          Built for Providers Who Want to Be Taken Seriously
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <BadgeCheck className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Verified Badges
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Complete ID, business, and insurance verification. Your badges
              tell customers you're legitimate before they even read your quote.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Star className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Reviews That Compound
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Every completed job builds your reputation. Providers with reviews
              win more jobs. Starting early means you stack reviews before
              competitors show up.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Shield className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Real Buying Intent
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Every lead on BidForJunk is a homeowner who described their junk,
              added photos, and set a budget. No cold calls. No empty traffic.
              Just people ready to hire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ObjectionSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-12">
          Common Questions
        </h2>
        <div className="space-y-6">
          {objections.map((obj) => (
            <div
              key={obj.q}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">{obj.q}</h3>
              <p className="text-gray-600 leading-relaxed">{obj.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-green-600 py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          Hamilton Is Hiring. Are You Listed?
        </h2>
        <p className="mt-4 text-green-100 text-lg leading-relaxed max-w-xl mx-auto">
          Homeowners are posting junk removal jobs every day. The providers who
          show up first, verified and reviewed, win the work.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white text-green-700 font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        <p className="mt-6 text-green-200 text-sm">
          Early launch providers get a 30-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                                */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <PricingHero />
      <ROISection />
      <PricingCards />
      <TrustSection />
      <ObjectionSection />
      <FinalCTA />
    </div>
  );
}
