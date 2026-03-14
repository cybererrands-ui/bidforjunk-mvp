import Link from "next/link";
import {
  Shield,
  DollarSign,
  Users,
  CheckCircle,
  Star,
  MessageSquare,
  Truck,
  Clock,
  HelpCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { FAQSection } from "./faq-section";

/* ------------------------------------------------------------------ */
/*  SECTION 1 — HERO                                                   */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden">
      {/* Header / Nav */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <span className="text-2xl font-bold text-green-600 tracking-tight">
          BidForJunk
        </span>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">
            Log In
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero content */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Get Junk Removal Quotes in Hamilton&nbsp;&mdash; Fast.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Get junk removal quotes fast &mdash; no credit card required.
          Compare verified, insured local providers.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="btn-primary text-lg px-8 py-3.5 shadow-lg shadow-green-600/20 hover:shadow-green-600/30"
          >
            Post a Job
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/pricing"
            className="btn-secondary text-lg px-8 py-3.5 border border-gray-300"
          >
            <Truck className="mr-2 h-5 w-5 text-green-600" />
            Providers: See Plans &amp; Pricing
          </Link>
        </div>

        {/* Trust bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Verified Providers
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            No Credit Card Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Dispute Support
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 2 — HOW IT WORKS                                           */
/* ------------------------------------------------------------------ */
const steps = [
  {
    num: 1,
    title: "Post Your Job",
    description:
      "Describe what needs to be removed, set your budget, and add photos. Hamilton only for now.",
    icon: MessageSquare,
  },
  {
    num: 2,
    title: "Get Offers & Negotiate",
    description:
      "Verified providers accept your budget or counter in a chat thread. Lock a price you're happy with.",
    icon: DollarSign,
  },
  {
    num: 3,
    title: "Hire & Get It Done",
    description:
      "Accept the best quote, coordinate directly with your verified provider, and get your junk removed.",
    icon: Truck,
  },
];

function HowItWorks() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">
          How It Works
        </h2>
        <p className="mt-3 text-center text-gray-500 text-lg">
          Three steps. Zero guesswork.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative card text-center hover:shadow-md transition-shadow"
              >
                {/* Step number badge */}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xl">
                  {step.num}
                </div>
                <Icon className="mx-auto mb-3 h-7 w-7 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 3 — OFFER STACK (What You Get)                             */
/* ------------------------------------------------------------------ */
const benefits = [
  "Multiple quotes in one place",
  "Every provider is ID-verified and insured",
  "No credit card needed to post a job",
  "Negotiate directly and lock a fair price",
];

function OfferStack() {
  return (
    <section className="bg-green-50 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          What You Get
        </h2>
        <p className="mt-3 text-gray-600 text-lg">
          Every job comes with built-in protection.
        </p>

        <ul className="mt-10 space-y-5 text-left max-w-md mx-auto">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-lg font-semibold text-gray-900">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 4 — TRUST & SAFETY                                        */
/* ------------------------------------------------------------------ */
const trustItems = [
  {
    icon: Users,
    title: "Provider Verification",
    text: "Every provider submits government ID, business registration, and proof of insurance. Our team reviews everything before they can quote.",
  },
  {
    icon: Shield,
    title: "Insurance Verified",
    text: "All providers carry active insurance. We track expiry dates and automatically hide providers with expired coverage.",
  },
  {
    icon: HelpCircle,
    title: "Dispute Support",
    text: "If there's more junk than described or a scope mismatch, our support team helps mediate a fair resolution.",
  },
];

function TrustAndSafety() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">
          Trust &amp; Safety Built In
        </h2>
        <p className="mt-3 text-center text-gray-500 text-lg">
          Every provider is verified, insured, and accountable.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card text-center hover:shadow-md transition-shadow">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Icon className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 5 — SOCIAL PROOF (Placeholder Testimonials)               */
/* ------------------------------------------------------------------ */
/* NOTE: These are placeholder testimonials for MVP launch.
   Replace with real customer reviews once collected. */
const testimonials = [
  {
    name: "Sarah M.",
    location: "Hamilton Mountain",
    quote:
      "Posted my garage cleanout at 8 AM. Had three offers by noon. Paid less than the first company I called.",
    stars: 5,
  },
  {
    name: "James T.",
    location: "Dundas, ON",
    quote:
      "Knowing every provider was verified and insured gave me total peace of mind. The job was done right.",
    stars: 5,
  },
  {
    name: "Priya K.",
    location: "Stoney Creek",
    quote:
      "I loved being able to negotiate directly with providers. Got a fair price and fast pickup.",
    stars: 4,
  },
];

function SocialProof() {
  return (
    <section className="bg-green-50 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">
          Trusted by Homeowners in Hamilton
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {/* Placeholder testimonials — replace with real data post-launch */}
          {testimonials.map((t) => (
            <div key={t.name} className="card hover:shadow-md transition-shadow">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {Array.from({ length: 5 - t.stars }).map((_, i) => (
                  <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-bold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 7 — FINAL CTA                                             */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="bg-green-600 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          Ready to Get Rid of Your Junk?
        </h2>
        <p className="mt-4 text-green-100 text-lg leading-relaxed">
          No commitment to post a job. Providers start with a free trial.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white text-green-700 font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Post a Job
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border-2 border-white text-white font-bold text-lg hover:bg-green-700 transition-colors"
          >
            <Truck className="mr-2 h-5 w-5" />
            Providers: Apply &amp; Get Jobs
          </Link>
        </div>

        <p className="mt-10 text-green-200 text-sm">
          Serving Hamilton, ON
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE EXPORT                                                        */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <OfferStack />
      <TrustAndSafety />
      <SocialProof />
      {/* Section 6 — FAQ (client component for accordion interactivity) */}
      <FAQSection />
      <FinalCTA />
    </div>
  );
}
