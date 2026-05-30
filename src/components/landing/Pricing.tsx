"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started with WhatsApp forms",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      { text: "3 forms", included: true },
      { text: "100 submissions/month", included: true },
      { text: "Basic templates", included: true },
      { text: "WhatsApp notifications", included: true },
      { text: "Community support", included: true },
      { text: "AI Form Builder", included: false },
      { text: "Analytics dashboard", included: false },
      { text: "Custom branding", included: false },
      { text: "Team collaboration", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For growing businesses that need more power",
    monthlyPrice: 49,
    yearlyPrice: 39,
    popular: true,
    features: [
      { text: "Unlimited forms", included: true },
      { text: "5,000 submissions/month", included: true },
      { text: "All templates", included: true },
      { text: "WhatsApp notifications", included: true },
      { text: "Priority support", included: true },
      { text: "AI Form Builder", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Custom branding", included: true },
      { text: "Team collaboration", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Business",
    description: "For teams that need full control and scale",
    monthlyPrice: 149,
    yearlyPrice: 119,
    popular: false,
    features: [
      { text: "Unlimited forms", included: true },
      { text: "Unlimited submissions", included: true },
      { text: "All templates", included: true },
      { text: "WhatsApp notifications", included: true },
      { text: "Dedicated support", included: true },
      { text: "AI Form Builder", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Custom branding", included: true },
      { text: "Team collaboration (5 seats)", included: true },
      { text: "API access & webhooks", included: true },
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-whatsapp-deep uppercase">
            Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Start for free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>

          {/* Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn("text-sm font-medium", !isYearly ? "text-gray-900" : "text-gray-500")}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative h-7 w-[52px] rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2",
                isYearly ? "bg-whatsapp" : "bg-gray-300"
              )}
              aria-label="Toggle yearly billing"
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300",
                  isYearly && "translate-x-[24px]"
                )}
              />
            </button>
            <span className={cn("text-sm font-medium", isYearly ? "text-gray-900" : "text-gray-500")}>
              Yearly
            </span>
            {isYearly && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Save 20%
              </span>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition-all",
                  plan.popular
                    ? "border-whatsapp bg-white shadow-card-lg ring-1 ring-whatsapp/20 scale-[1.02] lg:scale-105"
                    : "border-gray-200 bg-white shadow-card hover:shadow-card-lg"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-4 py-1.5 text-xs font-bold text-white shadow-md">
                      <Star className="h-3 w-3 fill-current" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      RM{price}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-gray-500">/month</span>
                    )}
                  </div>
                  {isYearly && price > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Billed RM{price * 12}/year
                    </p>
                  )}
                </div>

                <Link
                  href={
                    plan.name === "Free"
                      ? "/signup"
                      : `/signup?plan=${plan.name.toLowerCase()}&cycle=${isYearly ? "yearly" : "monthly"}`
                  }
                  className="mb-8 block"
                >
                  <button
                    className={cn(
                      "w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]",
                      plan.popular
                        ? "bg-whatsapp text-white shadow-md hover:bg-[#0DB849] hover:shadow-lg"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-whatsapp/30 hover:bg-whatsapp/5 hover:text-whatsapp-deep"
                    )}
                  >
                    {price === 0 ? "Get Started Free" : `Start with ${plan.name}`}
                  </button>
                </Link>

                <div className="flex-1 space-y-3">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    What&apos;s included
                  </p>
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          feature.included ? "text-gray-700" : "text-gray-400"
                        )}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pricing FAQ */}
        <motion.div
          className="mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900">
              Pricing Questions
            </h3>
            <div className="space-y-4">
              {[
                { q: "Can I upgrade or downgrade anytime?", a: "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the end of your current billing cycle." },
                { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, American Express), FPX online banking, and GrabPay. All payments are processed securely." },
                { q: "Is there a refund policy?", a: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 14 days for a full refund." },
              ].map((item) => (
                <div key={item.q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
