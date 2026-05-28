"use client";

import { motion } from "framer-motion";
import { PenLine, Share2, MessageCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PenLine,
    title: "You create the form & share it with customers",
    description:
      "Use our drag-and-drop builder to design your form, add your WhatsApp number, and get a shareable link instantly.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Customer fills in the data and clicks on Submit",
    description:
      "Customers visit your form on any device, fill in their details, and submit with one tap.",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "You get the data in WhatsApp from customer's number",
    description:
      "Receive a pre-filled WhatsApp message with all customer details — ready for you to reply instantly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How OneForm works
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-full hidden h-0.5 w-full -translate-x-1/2 bg-gray-200 md:block" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-whatsapp/10 to-green-50 text-whatsapp shadow-sm">
                  <step.icon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <span className="mb-3 block text-3xl font-extrabold text-gray-200">
                  {step.number}
                </span>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
