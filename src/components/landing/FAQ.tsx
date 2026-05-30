"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is OneForm free?",
    a: "Yes! We have a free forever plan that includes up to 3 forms and 100 submissions per month. You can upgrade to a paid plan anytime if you need more powerful features like AI form builder, analytics, and custom branding.",
  },
  {
    q: "How does the WhatsApp integration work?",
    a: "When a customer fills out your form and clicks submit, their responses are sent directly to your WhatsApp number as a formatted message. The customer's phone number is automatically included, so you can reply instantly. No WhatsApp Business API needed!",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption for all data in transit and at rest. Our infrastructure runs on Amazon Web Services with Cloudflare CDN protection. We never share your data with third parties, and you retain full ownership of all form submissions.",
  },
  {
    q: "How do I get started?",
    a: "Simply sign up using your Google account or email, choose from our ready-to-use templates or build a form from scratch with our drag-and-drop builder. You can have your first WhatsApp form live in under 5 minutes!",
  },
  {
    q: "Can I customize the form design?",
    a: "Yes! Our form builder lets you customize colors, fonts, logos, and layout. Pro and Business plans include full custom branding options including custom domains and white-label removal of OneForm branding.",
  },
  {
    q: "What types of forms can I create?",
    a: "You can create any type of form — contact forms, booking forms, order forms, feedback surveys, event registrations, lead capture forms, and more. Our AI form builder can also generate forms from a simple text description of what you need.",
  },
  {
    q: "Can multiple team members access submissions?",
    a: "Yes! With our Business plan, up to 5 team members can collaborate on forms and view submissions. You can also set up round-robin routing to distribute incoming leads across different WhatsApp numbers automatically.",
  },
  {
    q: "Is OneForm affiliated with WhatsApp or Meta?",
    a: "No, OneForm is not affiliated with WhatsApp or Meta Inc. in any way. We are an independent product that uses WhatsApp as a messaging platform to deliver form responses to your phone.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-whatsapp-deep uppercase">
            FAQ
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Everything you need to know about OneForm. Can&apos;t find the answer? Chat with us.
          </p>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <ScrollReveal key={faq.q} delay={Math.min(index * 0.04, 0.2)}>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="pr-4 text-sm font-semibold text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300",
                      openIndex === index && "rotate-180 text-whatsapp"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    openIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-12" delay={0.15}>
          <div className="rounded-2xl bg-gradient-to-br from-whatsapp/5 to-whatsapp/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp/10">
              <MessageCircle className="h-6 w-6 text-whatsapp" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Still have questions?</h3>
            <p className="mb-5 text-sm text-gray-600">
              Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <a
              href="mailto:contact@oneform.app"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-whatsapp/30 hover:bg-whatsapp/5 hover:text-whatsapp-deep"
            >
              <HelpCircle className="h-4 w-4" />
              Contact Us
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
