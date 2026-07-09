"use client";

import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { fireLeadEvent, sendCAPIEvent } from "@/lib/meta-pixel";
import { setPendingInstant } from "@/lib/instant-pending";
import {
  getInAppBrowserName,
  shouldUseTikTokWhatsAppWorkaround,
} from "@/lib/in-app-browser";
import {
  advanceTeamRoutingSnapshot,
  peekNextTeamRecipient,
  readTeamRoutingSnapshot,
  writeTeamRoutingSnapshot,
  type TeamRoutingSnapshot,
} from "@/lib/team-routing-client";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import { Button } from "@/components/ui/Button";
import { Check, CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PublicFormProps {
  title: string;
  description?: string | null;
  ctaText: string;
  whatsappNumber: string;
  fields: FormField[];
  formId: string;
  whatsappTemplate?: string | null;
  preview?: boolean;
  pixelId?: string;
  /** When true (default), TikTok shows manual WhatsApp open screen after submit. */
  tiktokMode?: boolean;
  usesTeamRouting?: boolean;
  teamRoutingSnapshot?: TeamRoutingSnapshot | null;
}

type ManualOpenState = {
  apiUrl: string;
  appUrl: string;
};

function openWhatsApp(url: string) {
  window.location.assign(url);
}

function saveSubmissionInBackground(formId: string, values: Record<string, string>) {
  void fetch(`/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    keepalive: true,
  }).catch(() => {});
}

function extractPii(fields: FormField[], values: Record<string, string>) {
  let email: string | undefined;
  let phone: string | undefined;
  for (const field of fields) {
    const value = values[field.id]?.trim();
    if (!value) continue;
    if (field.type === "email" && !email) email = value;
    if (field.type === "phone" && !phone) phone = value;
  }
  return { email, phone };
}

const SUBMIT_UNLOCK_MS = 3000;

export function PublicFormView({
  title,
  description,
  ctaText,
  whatsappNumber,
  fields,
  formId,
  whatsappTemplate,
  preview = false,
  pixelId,
  tiktokMode = true,
  usesTeamRouting = false,
  teamRoutingSnapshot = null,
}: PublicFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [manualOpen, setManualOpen] = useState<ManualOpenState | null>(null);
  const [copied, setCopied] = useState(false);
  const [appName, setAppName] = useState<string | null>(null);
  const [routingSnapshot, setRoutingSnapshot] = useState<TeamRoutingSnapshot | null>(
    teamRoutingSnapshot
  );
  const submitRef = useRef<HTMLButtonElement>(null);
  const unlockTimerRef = useRef<number | null>(null);

  const unlockSubmit = () => {
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (!teamRoutingSnapshot) return;
    setRoutingSnapshot(readTeamRoutingSnapshot(formId, teamRoutingSnapshot));
  }, [formId, teamRoutingSnapshot]);

  useEffect(() => {
    setAppName(getInAppBrowserName());
  }, []);

  useEffect(() => {
    const onPageShow = () => unlockSubmit();
    const onVisible = () => {
      if (document.visibilityState === "visible") unlockSubmit();
    };
    const onFocus = () => unlockSubmit();

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const requiredFields = fields.filter((f) => f.required && f.type !== "title");
    const fieldErrors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      if (!values[field.id]?.trim()) {
        fieldErrors[field.id] = `${field.label} is required`;
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      submitRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (!whatsappNumber.trim()) {
      setErrors({ _form: "WhatsApp number is not configured for this form." });
      return;
    }

    if (preview) return;

    let targetPhone = whatsappNumber;

    if (usesTeamRouting && routingSnapshot) {
      const nextRecipient = peekNextTeamRecipient(routingSnapshot);
      if (nextRecipient?.phone) {
        targetPhone = nextRecipient.phone;
        const advanced = advanceTeamRoutingSnapshot(routingSnapshot);
        setRoutingSnapshot(advanced);
        writeTeamRoutingSnapshot(formId, advanced);
      }
    }

    const submittedValues = { ...values };
    const appUrl = buildWhatsAppUrl(
      targetPhone,
      title,
      fields,
      submittedValues,
      whatsappTemplate,
      "app"
    );
    const apiUrl = buildWhatsAppUrl(
      targetPhone,
      title,
      fields,
      submittedValues,
      whatsappTemplate,
      "web"
    );

    setPendingInstant(setSubmitting, true);

    const eventId = fireLeadEvent(pixelId, title, formId);

    if (pixelId && typeof window !== "undefined") {
      const { email, phone } = extractPii(fields, submittedValues);
      sendCAPIEvent({
        pixelId,
        eventId,
        formId,
        formTitle: title,
        eventSourceUrl: window.location.href,
        email,
        phone,
        fbp: document.cookie.match(/(?:^|; )_fbp=([^;]*)/)?.[1],
        fbc: document.cookie.match(/(?:^|; )_fbc=([^;]*)/)?.[1],
        userAgent: navigator.userAgent,
      });
    }

    saveSubmissionInBackground(formId, submittedValues);
    setValues({});
    setErrors({});
    (document.activeElement as HTMLElement | null)?.blur();

    /**
     * TikTok only (when form TikTok mode is ON): NEVER auto-navigate to wa.me —
     * TikTok shows the padlock page. Stay on form.zaqone.com and let the user tap.
     */
    if (shouldUseTikTokWhatsAppWorkaround(tiktokMode)) {
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
      setManualOpen({ apiUrl, appUrl });
      setSubmitting(false);
      setCopied(false);
      return;
    }

    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      unlockTimerRef.current = null;
      setSubmitting(false);
    }, SUBMIT_UNLOCK_MS);

    // Fast redirect — notifications run in background on the server.
    window.setTimeout(() => openWhatsApp(appUrl), 50);
  };

  if (manualOpen) {
    const label = appName || "TikTok";

    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3 pt-1">
          <CheckCircle2 className="h-12 w-12 text-whatsapp" aria-hidden />
          <h1 className="text-xl font-bold leading-snug text-fg">Berjaya dihantar!</h1>
          <p className="text-sm text-muted-fg">
            {label} block WhatsApp auto-open. Tekan butang di bawah untuk hantar mesej.
          </p>
        </div>

        <a
          href={manualOpen.apiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-whatsapp px-5 py-3 text-sm font-medium text-white hover:bg-whatsapp-deep"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Cuba cara lain (WhatsApp link)
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
            <li>Isi form semula — terus pergi WhatsApp</li>
          </ol>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-whatsapp-deep hover:underline"
          onClick={() => {
            setManualOpen(null);
            setCopied(false);
          }}
        >
          Hantar lagi
        </button>

        <p className="text-xs text-muted-fg">Powered by OneForm · oneform.app</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-2 text-center">
        {title && (
          <h1 className="text-xl font-bold leading-snug text-fg">{title}</h1>
        )}
        {description && <p className="mt-1 text-sm text-muted-fg">{description}</p>}
      </div>

      <DynamicFieldRenderer
        fields={fields}
        values={values}
        onChange={handleChange}
        errors={errors}
        preview={preview}
        scrollTargetRef={submitRef}
      />

      {errors._form && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{errors._form}</p>
      )}

      <Button
        ref={submitRef}
        type="submit"
        variant="whatsapp"
        showWhatsAppIcon={!submitting}
        className="w-full scroll-mt-4"
        size="lg"
        disabled={submitting || preview}
      >
        {preview ? (
          ctaText
        ) : submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Opening WhatsApp...
          </>
        ) : (
          ctaText || "Submit on WhatsApp"
        )}
      </Button>

      {!preview && (
        <p className="text-center text-xs text-muted-fg">
          Powered by OneForm · oneform.app
        </p>
      )}
    </form>
  );
}
