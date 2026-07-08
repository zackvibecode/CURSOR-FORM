"use client";

import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { fireLeadEvent, sendCAPIEvent } from "@/lib/meta-pixel";
import { setPendingInstant } from "@/lib/instant-pending";
import { isRestrictiveInAppBrowser } from "@/lib/in-app-browser";
import {
  advanceTeamRoutingSnapshot,
  peekNextTeamRecipient,
  readTeamRoutingSnapshot,
  writeTeamRoutingSnapshot,
  type TeamRoutingSnapshot,
} from "@/lib/team-routing-client";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
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
  usesTeamRouting?: boolean;
  teamRoutingSnapshot?: TeamRoutingSnapshot | null;
}

function openWhatsApp(url: string) {
  // Same tab navigation — like a normal WhatsApp button (opens app or WhatsApp Web).
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

/** How long before we unlock the button if WhatsApp redirect never happens. */
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
  usesTeamRouting = false,
  teamRoutingSnapshot = null,
}: PublicFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
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

  // Reset stuck "Opening WhatsApp..." when user returns (Back / leave WhatsApp / bfcache).
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

    // TikTok / IG / FB block wa.me app deep-links. Use WhatsApp Web instead
    // (same flow as a normal WhatsApp button → web chat → user taps Send).
    const linkMode = isRestrictiveInAppBrowser() ? "web" : "app";
    const url = buildWhatsAppUrl(
      targetPhone,
      title,
      fields,
      submittedValues,
      whatsappTemplate,
      linkMode
    );

    setPendingInstant(setSubmitting, true);

    // --- Fire Meta Pixel Lead (browser) after validation passed ---
    const eventId = fireLeadEvent(pixelId, title, formId);

    // --- Send CAPI (server-side) with same event_id ---
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

    // Clear form so returning users can send another entry.
    setValues({});
    setErrors({});

    // Dismiss mobile keyboard before redirect.
    (document.activeElement as HTMLElement | null)?.blur();

    // Safety net — unlock if WhatsApp never opens / user stays on page.
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      unlockTimerRef.current = null;
      setSubmitting(false);
    }, SUBMIT_UNLOCK_MS);

    // keepalive fetch survives redirect; short delay lets browser pixel fire.
    window.setTimeout(() => openWhatsApp(url), 150);
  };

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
