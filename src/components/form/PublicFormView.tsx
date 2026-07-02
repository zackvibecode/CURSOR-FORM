"use client";

import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackFormSubmit } from "@/lib/meta-pixel";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface PublicFormProps {
  title: string;
  description?: string | null;
  ctaText: string;
  whatsappNumber: string;
  fields: FormField[];
  formId: string;
  whatsappTemplate?: string | null;
  onSubmit?: (data: Record<string, string>) => Promise<string | void>;
  preview?: boolean;
  pixelId?: string;
  usesTeamRouting?: boolean;
}

function saveSubmissionInBackground(formId: string, values: Record<string, string>) {
  void fetch(`/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    keepalive: true,
  });
}

function openWhatsApp(url: string) {
  window.location.replace(url);
}

export function PublicFormView({
  title,
  description,
  ctaText,
  whatsappNumber,
  fields,
  formId,
  whatsappTemplate,
  onSubmit,
  preview = false,
  pixelId,
  usesTeamRouting = false,
}: PublicFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      if (!usesTeamRouting) {
        const url = buildWhatsAppUrl(
          whatsappNumber,
          title,
          fields,
          values,
          whatsappTemplate
        );
        trackFormSubmit(pixelId, title, formId);
        saveSubmissionInBackground(formId, values);
        openWhatsApp(url);
        return;
      }

      setSubmitting(true);

      let targetPhone = whatsappNumber;

      if (onSubmit) {
        const assignedPhone = await onSubmit(values);
        if (assignedPhone) {
          targetPhone = assignedPhone;
        }
      }

      const url = buildWhatsAppUrl(targetPhone, title, fields, values, whatsappTemplate);
      trackFormSubmit(pixelId, title, formId);
      openWhatsApp(url);
    } catch {
      setErrors({ _form: "Submission failed. Please try again." });
      setSubmitting(false);
    }
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
