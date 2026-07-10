"use client";

import { useEffect, useState } from "react";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import {
  getInAppBrowserName,
  shouldUseTikTokWhatsAppWorkaround,
} from "@/lib/in-app-browser";
import { Button } from "@/components/ui/Button";
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, MessageCircle } from "lucide-react";

interface DirectWhatsAppViewProps {
  title: string;
  description?: string | null;
  ctaText: string;
  whatsappNumber: string;
  directMessage: string;
  tiktokMode?: boolean;
  preview?: boolean;
}

type ManualOpenState = {
  apiUrl: string;
  appUrl: string;
};

function openWhatsApp(url: string) {
  window.location.assign(url);
}

export function DirectWhatsAppView({
  title,
  description,
  ctaText,
  whatsappNumber,
  directMessage,
  tiktokMode = true,
  preview = false,
}: DirectWhatsAppViewProps) {
  const [manualOpen, setManualOpen] = useState<ManualOpenState | null>(null);
  const [redirecting, setRedirecting] = useState(!preview);
  const [copied, setCopied] = useState(false);
  const [appName, setAppName] = useState<string | null>(null);

  const appUrl = buildDirectWhatsAppUrl(whatsappNumber, directMessage, "app");
  const apiUrl = buildDirectWhatsAppUrl(whatsappNumber, directMessage, "web");

  useEffect(() => {
    setAppName(getInAppBrowserName());
  }, []);

  useEffect(() => {
    if (preview || !whatsappNumber.trim()) {
      setRedirecting(false);
      return;
    }

    if (shouldUseTikTokWhatsAppWorkaround(tiktokMode)) {
      setManualOpen({ apiUrl, appUrl });
      setRedirecting(false);
      return;
    }

    const timer = window.setTimeout(() => openWhatsApp(appUrl), 50);
    return () => window.clearTimeout(timer);
  }, [preview, whatsappNumber, directMessage, tiktokMode, appUrl, apiUrl]);

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!whatsappNumber.trim()) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold text-fg">{title || "Direct WhatsApp Link"}</h1>
        <p className="text-sm text-muted-fg">This link is not configured yet. Add a WhatsApp number in the editor.</p>
      </div>
    );
  }

  if (manualOpen) {
    const label = appName || "TikTok";

    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3 pt-1">
          <CheckCircle2 className="h-12 w-12 text-whatsapp" aria-hidden />
          <h1 className="text-xl font-bold leading-snug text-fg">{title || "Chat on WhatsApp"}</h1>
          {description ? <p className="text-sm text-muted-fg">{description}</p> : null}
          <p className="text-sm text-muted-fg">
            {label} block WhatsApp auto-open. Tekan butang di bawah untuk buka chat.
          </p>
        </div>

        <a
          href={manualOpen.apiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-whatsapp-dark px-5 py-3 text-sm font-medium text-white hover:bg-whatsapp-deep"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {ctaText || "Chat on WhatsApp"}
        </a>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => void handleCopy(manualOpen.appUrl)}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Link disalin — paste dalam browser
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              Copy link WhatsApp
            </>
          )}
        </Button>

        <div className="rounded-md border border-border bg-muted/50 px-4 py-3 text-left text-xs leading-relaxed text-muted-fg">
          <p className="font-semibold text-fg">Kalau masih block:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>
              Tekan menu <span className="font-semibold">⋯</span> atas kanan
            </li>
            <li>
              Pilih <span className="font-semibold">Open in browser</span> / Buka dalam browser
            </li>
            <li>Buka link semula — terus pergi WhatsApp</li>
          </ol>
        </div>

        <p className="text-xs text-muted-fg">Powered by OneForm · oneform.app</p>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3">
          <MessageCircle className="h-10 w-10 text-whatsapp" aria-hidden />
          <h1 className="text-xl font-bold text-fg">{title || "Direct WhatsApp Link"}</h1>
          {description ? <p className="text-sm text-muted-fg">{description}</p> : null}
          <p className="text-sm text-muted-fg">
            Visitors open this link and go straight to WhatsApp — no form to fill.
          </p>
        </div>
        {directMessage ? (
          <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-left text-sm text-fg">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-fg">
              Pre-filled message
            </p>
            <p className="whitespace-pre-wrap">{directMessage}</p>
          </div>
        ) : null}
        <Button type="button" variant="whatsapp" className="w-full" size="lg" showWhatsAppIcon disabled>
          {ctaText || "Chat on WhatsApp"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-3 pt-2">
        <Loader2 className="h-10 w-10 animate-spin text-whatsapp" aria-hidden />
        <h1 className="text-xl font-bold text-fg">{title || "Opening WhatsApp..."}</h1>
        {description ? <p className="text-sm text-muted-fg">{description}</p> : null}
        <p className="text-sm text-muted-fg">
          {redirecting ? "Opening WhatsApp..." : "Preparing your chat..."}
        </p>
      </div>

      {!redirecting && appUrl ? (
        <a
          href={appUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-whatsapp-dark px-5 py-3 text-sm font-medium text-white hover:bg-whatsapp-deep"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {ctaText || "Chat on WhatsApp"}
        </a>
      ) : null}

      <p className="text-xs text-muted-fg">Powered by OneForm · oneform.app</p>
    </div>
  );
}
