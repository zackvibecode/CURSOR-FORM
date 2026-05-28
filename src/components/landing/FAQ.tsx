"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is OneForm Free?",
    a: "We have a free forever plan. You can choose a paid plan if you need powerful features.",
  },
  {
    q: "Is my data secure?",
    a: "Our servers are the most secure and fastest ones available currently. We use Amazon web services and Cloudflare CDN.",
  },
  {
    q: "How to Get Started",
    a: "Simply signup using a Google account and create your form from any template. It's easier than you imagine.",
  },
  {
    q: "Is OneForm run by WhatsApp or Meta?",
    a: "No, OneForm is not affiliated with WhatsApp or Meta Inc. in any way. We are an independent product that operates using WhatsApp as a platform.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.q}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
                    openIndex === index && "rotate-180 text-whatsapp"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openIndex === index ? "max-h-40" : "max-h-0"
                )}
              >
                <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Have a Question CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="mb-3 text-sm text-gray-500">
            Have a Question?
          </p>
          <p className="mb-4 text-sm text-gray-600">
            If you have more questions feel free to contact us.
          </p>
          <a
            href="mailto:contact@oneform.app"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            <HelpCircle className="h-4 w-4" />
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  );
}
