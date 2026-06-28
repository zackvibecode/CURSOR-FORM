"use client";

import { useState } from "react";
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

  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted-fg focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20";

  return (
    <section className={containerClass}>
      <div className={inDashboard ? "" : "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"}>
        {!inDashboard && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-fg">
              <LinkIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              WhatsApp Link Generator
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-fg">
              Create wa.me links with pre-filled messages. Share on websites, social media, or emails to start instant WhatsApp chats.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left: Input Form */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-muted-fg" />
                <label className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                  Phone number
                </label>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="60123456789"
                className={cn(inputClass, "font-mono")}
              />
              <p className="mt-1.5 text-[11px] text-muted-fg">
                Enter the full number with country code (no + sign). Example: 60123456789 for Malaysia
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-fg" />
                <label className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                  Pre-filled message (optional)
                </label>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'm interested in your services. Can you tell me more?"
                rows={4}
                className={cn(inputClass, "resize-none")}
              />
              <p className="mt-1.5 text-[11px] text-muted-fg">
                This message will appear in the chat when someone clicks the link
              </p>
            </div>
          </div>

          {/* Right: Output & Preview */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                Generated link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 overflow-hidden rounded-md border border-border bg-muted px-3 py-2">
                  <p className="truncate font-mono text-xs text-fg">
                    {waLink || (
                      <span className="text-muted-fg italic">Enter a phone number to generate link</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!waLink}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    copied
                      ? "bg-whatsapp text-white"
                      : waLink
                        ? "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
                        : "cursor-not-allowed bg-muted text-muted-fg/50"
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                Preview
              </label>

              {!waLink ? (
                <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-border">
                  <p className="text-xs text-muted-fg">Link preview will appear here</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border border-border bg-[#E5DDD5]">
                  <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                      {cleanPhone.slice(-2) || "?"}
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold text-white">+{cleanPhone}</p>
                      <p className="text-[10px] text-white/70">WhatsApp</p>
                    </div>
                  </div>

                  <div className="p-3">
                    {message ? (
                      <div className="ml-auto max-w-[80%] rounded-md rounded-tr-none bg-[#DCF8C6] px-2.5 py-1.5 shadow-sm">
                        <p className="whitespace-pre-wrap text-xs text-gray-800">{message}</p>
                        <p className="mt-1 text-right font-mono text-[9px] text-gray-500">
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-16 items-center justify-center">
                        <p className="text-[11px] text-gray-500 italic">No pre-filled message</p>
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
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card py-2 text-sm font-medium text-fg transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Test link on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
