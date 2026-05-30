"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Globe, Repeat, ArrowRight } from "lucide-react";

const languages = [
  { flag: "🇺🇸", name: "English" },
  { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇫🇷", name: "French" },
  { flag: "🇯🇵", name: "Japanese" },
  { flag: "🇰🇷", name: "Korean" },
];

export function AIFeatures() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* AI Builder headline */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-whatsapp/20 bg-whatsapp/5 px-4 py-1.5 text-sm font-medium text-whatsapp-deep">
            <Sparkles className="h-4 w-4" />
            AI-Powered
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Create Forms Instantly with AI
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Describe your business and what you want to collect. Our AI builds your WhatsApp form in seconds.
          </p>
        </motion.div>

        {/* AI Builder Demo Card */}
        <motion.div
          className="mx-auto mb-20 max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-green-50/50 p-6 sm:p-8">
              {/* Input area */}
              <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles className="h-4 w-4 text-whatsapp" />
                  <span>AI Form Builder</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  &ldquo;I run a cake shop and want to collect orders with pastry type, delivery address, and phone number.&rdquo;
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-whatsapp text-white">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Generated form preview */}
              <div className="rounded-xl border border-whatsapp/20 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-whatsapp-deep">
                  <Image src="/favicon-icon.png" alt="" width={20} height={20} className="h-5 w-5 mix-blend-screen" />
                  Generated Form
                </div>
                <div className="space-y-2.5">
                  {["Your name", "Choose your pastry", "Delivery address", "Phone number"].map((field) => (
                    <div key={field} className="rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-400">{field}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-whatsapp py-2.5 text-xs font-semibold text-white">
                    <span>Submit on WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0DB849] hover:shadow-lg active:scale-[0.98]">
                    <Sparkles className="h-4 w-4" />
                    Generate Form
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Multi-language + templates + google form */}
        <div className="grid gap-8 sm:grid-cols-3">
          <motion.div
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Translate to all major languages
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Create forms in multiple languages to connect with users worldwide.
            </p>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang.name}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  <span>{lang.flag}</span>
                  {lang.name}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Start from ready-to-use templates
            </h3>
            <p className="text-sm text-gray-500">
              Choose from pre-designed templates, customize them in seconds, and start collecting responses instantly.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Repeat className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Convert Google Form in One-Click
            </h3>
            <p className="text-sm text-gray-500">
              Instantly transform your Google Forms into WhatsApp-friendly forms with just one click — quick, easy, and hassle-free!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
