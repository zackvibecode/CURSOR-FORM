"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function Footer() {
  return (
    <>
      {/* CTA Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Ready to Transform Your
              <br />
              <span className="text-whatsapp">Customer Interaction?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-gray-500">
              Sign up and see the difference OneForm can make for your business
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <button className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#0DB849] hover:shadow-lg active:scale-[0.98]">
                  <WhatsAppIcon className="h-5 w-5" />
                  Create a free form
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <BrandLogo />
            <nav className="flex flex-wrap gap-6 text-sm text-gray-500">
              <Link href="/demo" className="transition-colors hover:text-whatsapp-deep">
                Demo
              </Link>
              <Link href="/signup" className="transition-colors hover:text-whatsapp-deep">
                Get Started
              </Link>
              <Link href="/login" className="transition-colors hover:text-whatsapp-deep">
                Login
              </Link>
              <a
                href="https://oneform.app"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-whatsapp-deep"
              >
                oneform.app
              </a>
            </nav>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} OneForm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
