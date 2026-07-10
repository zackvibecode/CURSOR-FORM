"use client";

import { Copy, Check, MessageSquare, Smartphone } from "lucide-react";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import { getFormPublicUrl } from "@/lib/forms";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DirectLinkEditorProps {
  whatsappNumber: string;
  onWhatsappNumberChange: (value: string) => void;
  directMessage: string;
  onDirectMessageChange: (value: string) => void;
  slug: string;
}

export function DirectLinkEditor({
  whatsappNumber,
  onWhatsappNumberChange,
  directMessage,
  onDirectMessageChange,
  slug,
}: DirectLinkEditorProps) {
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  const waLink = buildDirectWhatsAppUrl(whatsappNumber, directMessage, "app");
  const publicUrl = getFormPublicUrl(slug);

  async function copyText(text: string, setter: (v: boolean) => void) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-bg p-6 scrollbar-thin">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-fg">Direct WhatsApp Link</h3>
          <p className="mt-0.5 text-xs text-muted-fg">
            No form fields — visitors open your OneForm link and go straight to WhatsApp with your
            pre-filled message.
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-muted-fg" />
              <Label>WhatsApp number *</Label>
            </div>
            <Input
              value={whatsappNumber}
              onChange={(e) => onWhatsappNumberChange(e.target.value)}
              placeholder="+60123456789"
              className="font-mono"
            />
            <p className="mt-1 text-[11px] text-muted-fg">
              Include country code. Chats open to this number.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-fg" />
              <Label>Pre-filled message (pretext)</Label>
            </div>
            <Textarea
              value={directMessage}
              onChange={(e) => onDirectMessageChange(e.target.value)}
              placeholder="Hi! I'm interested in your services..."
              rows={5}
              className="resize-none"
            />
            <p className="mt-1 text-[11px] text-muted-fg">
              This text appears in WhatsApp when someone opens your link.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <Label className="text-[11px] uppercase tracking-wide text-muted-fg">
              OneForm share link
            </Label>
            <div className="mt-2 flex gap-2">
              <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted px-3 py-2">
                <p className="truncate font-mono text-xs text-fg">{publicUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyText(publicUrl, setCopiedPublic)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  copiedPublic
                    ? "bg-whatsapp text-white"
                    : "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
                )}
              >
                {copiedPublic ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedPublic ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-[11px] uppercase tracking-wide text-muted-fg">
              WhatsApp link preview
            </Label>
            <div className="mt-2 flex gap-2">
              <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted px-3 py-2">
                <p className="truncate font-mono text-xs text-fg">
                  {waLink || (
                    <span className="italic text-muted-fg">Enter a WhatsApp number to preview</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={!waLink}
                onClick={() => void copyText(waLink, setCopiedWa)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  copiedWa
                    ? "bg-whatsapp text-white"
                    : waLink
                      ? "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
                      : "cursor-not-allowed bg-muted text-muted-fg/50"
                )}
              >
                {copiedWa ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedWa ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {directMessage ? (
            <div className="overflow-hidden rounded-md border border-border bg-[#E5DDD5]">
              <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                  WA
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">WhatsApp preview</p>
                  <p className="text-[10px] text-white/70">Pre-filled message</p>
                </div>
              </div>
              <div className="p-3">
                <div className="ml-auto max-w-[85%] rounded-md rounded-tr-none bg-[#DCF8C6] px-2.5 py-1.5 shadow-sm">
                  <p className="whitespace-pre-wrap text-xs text-gray-800">{directMessage}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
