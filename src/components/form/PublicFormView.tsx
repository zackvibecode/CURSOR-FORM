"use client";

import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useState } from "react";

interface PublicFormProps {
  title: string;
  description?: string | null;
  ctaText: string;
  whatsappNumber: string;
  fields: FormField[];
  formId: string;
  onSubmit?: (data: Record<string, string>) => Promise<void>;
  preview?: boolean;
}

export function PublicFormView({
  title,
  description,
  ctaText,
  whatsappNumber,
  fields,
  formId,
  onSubmit,
  preview = false,
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

    setSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(values);
      }

      const url = buildWhatsAppUrl(whatsappNumber, title, fields, values);
      window.location.href = url;
    } catch (err) {
      setErrors({ _form: "Submission failed. Please try again." });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp text-white shadow-soft">
          <WhatsAppIcon className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-brand-text">{title}</h1>
        {description && <p className="mt-2 text-sm text-brand-muted">{description}</p>}
      </div>

      <DynamicFieldRenderer
        fields={fields}
        values={values}
        onChange={handleChange}
        errors={errors}
        preview={preview}
      />

      {errors._form && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors._form}</p>
      )}

      <Button
        type="submit"
        variant="whatsapp"
        showWhatsAppIcon
        className="w-full"
        size="lg"
        disabled={submitting || preview}
      >
        {preview ? ctaText : submitting ? "Opening WhatsApp..." : ctaText || "Submit via WhatsApp"}
      </Button>

      {!preview && (
        <p className="text-center text-xs text-brand-muted">
          Powered by ZAQONE.FORM · Zaq1.com
        </p>
      )}
    </form>
  );
}
