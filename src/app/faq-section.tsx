"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Do I need a credit card to post a job?",
    answer:
      "No. Posting a job is completely free — no credit card required. Describe your junk, add photos, set a budget, and start receiving quotes from verified local providers.",
  },
  {
    question: "How do I pay the provider?",
    answer:
      "Payment is arranged directly between you and your chosen provider. Once you accept a quote and the job is complete, you pay the provider at the agreed price. BidForJunk connects you with verified professionals — we handle the trust, you handle the transaction.",
  },
  {
    question: "What if there's more junk than I posted?",
    answer:
      "If the provider arrives and the scope is larger than described, they can flag it. You and the provider negotiate a fair adjustment through the chat thread. If you can't agree, our support team steps in to mediate and find a resolution. You're never forced to pay more without agreeing first.",
  },
  {
    question: "How do providers get verified?",
    answer:
      "Every provider submits government-issued ID, business registration, and proof of insurance. Our team reviews each application before granting access. Only verified, insured providers can quote on jobs. Providers with expired insurance are automatically hidden.",
  },
  {
    question: "How does pricing/budget work?",
    answer:
      "You set a budget when you post your job. Providers can accept your budget as-is or send a counter-offer through the chat thread. You negotiate back and forth until you agree on a price. Once locked, that price is final — no surprises on job day.",
  },
];

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <HelpCircle className="h-7 w-7 text-green-600" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>
        <p className="text-center text-gray-500 text-lg mb-12">
          Everything you need to know before posting your first job.
        </p>

        <div className="card divide-y divide-gray-200">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
