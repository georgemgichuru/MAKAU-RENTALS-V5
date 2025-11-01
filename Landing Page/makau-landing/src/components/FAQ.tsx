"use client";

import React from "react";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

const faqs: FAQItem[] = [
  {
    question: "What is Nyumbani Rentals?",
    answer:
      "Nyumbani Rentals is a modern property management platform that helps landlords and managers automate rent collection, track tenants and units, and generate reports.",
  },
  {
    question: "Does the system have any downtimes?",
    answer:
      "We architect for high availability and perform rolling updates. In the unlikely event of maintenance, we'll notify you in advance.",
  },
  {
    question: "Do I have to pay for upgrades?",
    answer:
      "No. We continuously deliver new features and improvements at no extra cost within your active plan.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Data is encrypted in transit (HTTPS) and backed up regularly. Access is role‑based to keep information secure.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "You get 30 days of full access with no credit card required. You can upgrade, downgrade, or cancel anytime.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "We support mobile money (M-Pesa), card payments, and bank transfers via our integrated providers.",
  },
  {
    question: "Can tenants pay from their phones?",
    answer:
      "Absolutely. Tenants receive invoices and can pay from their phones. Payments are matched to the right tenant automatically.",
  },
  {
    question: "Can I import existing tenants and units?",
    answer:
      "Yes. We help you migrate your current data using spreadsheets so you can get started quickly.",
  },
  {
    question: "Do you provide support and training?",
    answer:
      "Yes. Our team offers onboarding assistance, help docs, and responsive email support.",
  },
];

export default function FAQ() {
  return (
    <section id="faqs" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-10">FAQs</h2>

          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.question}
                  </h3>
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-transform group-open:rotate-180">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Can’t find what you’re looking for? <a href="/contact" className="text-indigo-600 hover:text-indigo-700 underline">Contact us</a> and we’ll help.
          </p>
        </div>
      </div>
    </section>
  );
}
