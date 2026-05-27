"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is WhatsLead free?",
    a: "Yes! We have a free forever plan. You can create unlimited forms and collect leads on WhatsApp at no cost.",
  },
  {
    q: "Is my data secure?",
    a: "We use industry-standard security practices. Your form data is encrypted and stored securely.",
  },
  {
    q: "How do I get started?",
    a: "Simply sign up with your Google account, pick a template or create a blank form, add your WhatsApp number, and publish.",
  },
  {
    q: "Is WhatsLead affiliated with WhatsApp or Meta?",
    a: "No. WhatsLead is an independent product that uses WhatsApp as a platform. We are not affiliated with Meta Inc.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.q}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white"
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-gray-100 px-6 py-4 text-gray-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
