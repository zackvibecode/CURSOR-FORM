"use client";

import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackFormSubmit } from "@/lib/meta-pixel";
import { setPendingInstant } from "@/lib/instant-pending";
import {
  advanceTeamRoutingSnapshot,
  peekNextTeamRecipient,
  readTeamRoutingSnapshot,
  writeTeamRoutingSnapshot,
  type TeamRoutingSnapshot,
} from "@/lib/team-routing-client";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

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
  window.location.replace(url);
}

function saveSubmissionInBackground(formId: string, values: Record<string, string>) {
  void fetch(`/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    keepalive: true,
  }).catch(() => {
    // keepalive helps the request finish during navigation
  });
}

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

  useEffect(() => {
    if (!teamRoutingSnapshot) return;
    setRoutingSnapshot(readTeamRoutingSnapshot(formId, teamRoutingSnapshot));
  }, [formId, teamRoutingSnapshot]);

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

    const url = buildWhatsAppUrl(targetPhone, title, fields, values, whatsappTemplate);

    setPendingInstant(setSubmitting, true);
    trackFormSubmit(pixelId, title, formId);
    saveSubmissionInBackground(formId, values);

    // Give Meta Pixel time to send the Lead event before navigating to WhatsApp.
    window.setTimeout(() => openWhatsApp(url), 350);
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
      />

      {errors._form && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{errors._form}</p>
      )}

      <Button
        type="submit"
        variant="whatsapp"
        showWhatsAppIcon
        className="w-full"
        size="lg"
        disabled={submitting || preview}
      >
        {preview ? ctaText : submitting ? "Opening WhatsApp..." : ctaText || "Submit on WhatsApp"}
      </Button>

      {!preview && (
        <p className="text-center text-xs text-muted-fg">
          Powered by OneForm · oneform.app
        </p>
      )}
    </form>
  );
}
