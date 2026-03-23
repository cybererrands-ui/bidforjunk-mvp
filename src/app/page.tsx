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
  ArrowRight,
  Zap,
  TrendingUp,
  MapPin,
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
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero content */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <MapPin className="h-4 w-4" />
          Now Live Across Canada
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Stop Overpaying for
          <br />
          <span className="text-green-600">Junk Removal</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Post your job in 60 seconds. Get competing quotes from verified,
          insured local haulers. Pick the best price. No credit card needed.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="btn-primary text-lg px-8 py-3.5 shadow-lg shadow-green-600/20 hover:shadow-green-600/30"
          >
            Post a Job Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/pricing"
            className="btn-secondary text-lg px-8 py-3.5 border border-gray-300"
          >
            <Truck className="mr-2 h-5 w-5 text-green-600" />
            I&apos;m a Hauler
          </Link>
        </div>

        {/* Trust bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            ID-Verified Providers
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Proof of Insurance Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            100% Free for Homeowners
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
    title: "Describe Your Junk",
    description:
      "Tell us what needs to go. Add photos, set your budget, pick a date. Takes about 60 seconds.",
    icon: MessageSquare,
  },
  {
    num: 2,
    title: "Get Competing Quotes",
    description:
      "Verified, insured providers bid on your job. Compare prices, reviews, and credentials side by side.",
    icon: DollarSign,
  },
  {
    num: 3,
    title: "Pick & Get It Done",
    description:
      "Accept the best offer, coordinate directly with your hauler, and get your space back.",
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
          Three steps. Zero commitment. Real savings.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative card text-center hover:shadow-md transition-shadow"
              >
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
/*  SECTION 3 — THE OFFER (What You Get)                               */
/* ------------------------------------------------------------------ */
const benefits = [
  "Multiple competing quotes — not just one phone call",
  "Every provider is ID-verified and insured",
  "Zero cost to post a job — no credit card ever",
  "Negotiate directly and lock a fair price before the truck arrives",
  "Dispute support if anything goes sideways",
];

function OfferStack() {
  return (
    <section className="bg-green-50 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          Why Homeowners Choose BidForJunk
        </h2>
        <p className="mt-3 text-gray-600 text-lg">
          Every job posted comes with these guarantees.
        </p>

        <ul className="mt-10 space-y-5 text-left max-w-lg mx-auto">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-lg font-semibold text-gray-900">{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/signup"
            className="btn-primary text-lg px-8 py-3.5 shadow-lg shadow-green-600/20"
          >
            Post Your First Job
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
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
    title: "3-Step Verification",
    text: "Every provider submits government ID, business registration, and proof of insurance. Our team reviews it all before they can quote.",
  },
  {
    icon: Shield,
    title: "Insurance Tracked",
    text: "All providers carry active insurance. We track expiry dates and automatically hide providers with expired coverage.",
  },
  {
    icon: Clock,
    title: "24-Hour Offer Expiry",
    text: "No stale quotes sitting around. Every offer expires in 24 hours so you always get fresh, competitive pricing.",
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
          We do the vetting so you don&apos;t have to.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="card text-center hover:shadow-md transition-shadow"
              >
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
/*  SECTION 5 — PROVIDER CTA                                           */
/* ------------------------------------------------------------------ */
const providerBenefits = [
  {
    icon: Zap,
    title: "Qualified Leads",
    text: "Every job is a real customer who needs junk removed now. No tire-kickers.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    text: "Start with a free trial. Upgrade when you're winning enough jobs to justify it.",
  },
  {
    icon: Shield,
    title: "Stand Out",
    text: "Your verification badges and reviews build trust that one-off Kijiji ads never will.",
  },
];

function ProviderSection() {
  return (
    <section className="bg-gray-900 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white">
          Haulers: Get More Jobs Without the Hustle
        </h2>
        <p className="mt-3 text-center text-gray-400 text-lg">
          Stop chasing leads. Let verified customers come to you.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {providerBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-gray-800 rounded-xl p-6 text-center"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/50">
                  <Icon className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-gray-400 leading-relaxed">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            See Plans &amp; Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION 6 — SOCIAL PROOF                                           */
/* ------------------------------------------------------------------ */
/* NOTE: Placeholder testimonials for MVP launch.
   Replace with real customer reviews once collected. */
const testimonials = [
  {
    name: "Sarah M.",
    location: "Hamilton Mountain",
    quote:
      "Posted my garage cleanout at 8 AM. Had three offers by noon. Paid way less than the first company I called.",
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
      "I loved being able to negotiate directly. Got a fair price and same-day pickup.",
    stars: 4,
  },
];

function SocialProof() {
  return (
    <section className="bg-green-50 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">
          Trusted by Homeowners Across Canada
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {Array.from({ length: 5 - t.stars }).map((_, i) => (
                  <Star
                    key={`empty-${i}`}
                    className="h-5 w-5 text-gray-300"
                  />
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
/*  SECTION 8 — FINAL CTA                                             */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="bg-green-600 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          Your Junk Won&apos;t Remove Itself
        </h2>
        <p className="mt-4 text-green-100 text-lg leading-relaxed">
          Post a job in 60 seconds. Get quotes from verified haulers.
          No commitment. No credit card.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white text-green-700 font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Post a Job Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border-2 border-white text-white font-bold text-lg hover:bg-green-700 transition-colors"
          >
            <Truck className="mr-2 h-5 w-5" />
            Join as a Provider
          </Link>
        </div>

        <p className="mt-10 text-green-200 text-sm">
          Serving communities across Canada
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <span className="text-xl font-bold text-green-500">
              BidForJunk
            </span>
            <p className="mt-2 text-gray-400 text-sm">
              Canada&apos;s junk removal marketplace.
              Verified providers. Competitive prices.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">For Customers</h4>
            <div className="space-y-2 text-sm">
              <Link
                href="/signup"
                className="block text-gray-400 hover:text-white"
              >
                Post a Job
              </Link>
              <Link
                href="/login"
                className="block text-gray-400 hover:text-white"
              >
                Log In
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">For Providers</h4>
            <div className="space-y-2 text-sm">
              <Link
                href="/pricing"
                className="block text-gray-400 hover:text-white"
              >
                Plans &amp; Pricing
              </Link>
              <Link
                href="/signup"
                className="block text-gray-400 hover:text-white"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} BidForJunk. All rights reserved.
        </div>
      </div>
    </footer>
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
      <ProviderSection />
      <SocialProof />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
