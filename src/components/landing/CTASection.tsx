"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-whatsapp via-[#0DB849] to-whatsapp-deep py-20 sm:py-28">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-7 w-7 text-white" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Transform Your
            <br />
            Customer Interaction?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
            Join thousands of businesses that use OneForm to collect leads, bookings, and feedback directly on WhatsApp.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <button className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-whatsapp-deep shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]">
                <WhatsAppIcon className="h-5 w-5" />
                Create a Free Form
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/demo">
              <button className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 active:scale-[0.98]">
                View Demo
              </button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/60">
            No credit card required &middot; Free forever plan available &middot; Setup in 5 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
