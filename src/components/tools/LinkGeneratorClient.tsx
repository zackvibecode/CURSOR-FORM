"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LinkIcon,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkGeneratorClientProps {
  inDashboard?: boolean;
}

export function LinkGeneratorClient({ inDashboard = false }: LinkGeneratorClientProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMessage = message ? encodeURIComponent(message) : "";
  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ""}`
    : "";

  async function handleCopy() {
    if (!waLink) return;
    try {
      await navigator.clipboard.writeText(waLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = waLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const containerClass = inDashboard ? "" : "py-12 sm:py-20";

  return (
    <section className={containerClass}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {!inDashboard && (
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-whatsapp/10">
              <LinkIcon className="h-7 w-7 text-whatsapp-deep" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              WhatsApp Link Generator
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Create wa.me links with pre-filled messages. Share on websites, social media, or emails to start instant WhatsApp chats.
            </p>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Input Form */}
          <motion.div
            className="space-y-6"
            initial={inDashboard ? false : { opacity: 0, x: -20 }}
            animate={inDashboard ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-semibold text-gray-900">Phone Number</label>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="60123456789"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
              />
              <p className="mt-2 text-xs text-gray-400">
                Enter the full number with country code (no + sign). Example: 60123456789 for Malaysia
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-semibold text-gray-900">Pre-filled Message (optional)</label>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in your services. Can you tell me more?"
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
              />
              <p className="mt-2 text-xs text-gray-400">
                This message will appear in the chat when someone clicks the link
              </p>
            </div>
          </motion.div>

          {/* Right: Output & Preview */}
          <motion.div
            className="space-y-6"
            initial={inDashboard ? false : { opacity: 0, x: 20 }}
            animate={inDashboard ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-sm font-semibold text-gray-900">Generated Link</label>
              <div className="flex gap-2">
                <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="truncate text-sm text-gray-700">
                    {waLink || <span className="text-gray-400 italic">Enter a phone number to generate link</span>}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!waLink}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                    copied
                      ? "bg-green-500 text-white"
                      : waLink
                        ? "bg-whatsapp text-white shadow-sm hover:bg-[#0DB849]"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-4 block text-sm font-semibold text-gray-900">Preview</label>

              {!waLink ? (
                <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Link preview will appear here</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#E5DDD5]">
                  <div className="flex items-center gap-3 bg-[#008069] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                      {cleanPhone.slice(-2) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">+{cleanPhone}</p>
                      <p className="text-xs text-white/70">WhatsApp</p>
                    </div>
                  </div>

                  <div className="p-4">
                    {message ? (
                      <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-[#DCF8C6] px-3 py-2 shadow-sm">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
                        <p className="mt-1 text-right text-[10px] text-gray-500">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-20 items-center justify-center">
                        <p className="text-xs text-gray-400 italic">No pre-filled message</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-whatsapp/30 bg-whatsapp/5 py-3 text-sm font-semibold text-whatsapp-deep transition-all hover:bg-whatsapp/10 active:scale-[0.98]"
              >
                <ExternalLink className="h-4 w-4" />
                Test Link on WhatsApp
              </a>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}