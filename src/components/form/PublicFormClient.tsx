"use client";

import { useEffect, useState } from "react";
import { PublicFormView } from "@/components/form/PublicFormView";
import { mapDbFieldToFormField } from "@/lib/forms";
import type { DbForm, DbFormField } from "@/lib/database.types";
import type { FormField } from "@/lib/form-schema";
import { BrandLogo } from "@/components/ui/BrandLogo";
import Link from "next/link";

export function PublicFormClient({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DbForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/public/forms/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Form not found");
        setLoading(false);
        return;
      }

      setForm(data.form);
      setFields((data.fields as DbFormField[]).map(mapDbFieldToFormField));
      setLoading(false);
    }

    loadForm();
  }, [slug]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!form) return;
    const res = await fetch(`/api/forms/${form.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });

    if (!res.ok) {
      throw new Error("Submission failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <p className="text-brand-muted">Loading form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-text">Form not found</h1>
          <p className="mb-6 text-brand-muted">
            This form may have been removed or is not published yet.
          </p>
          <Link href="/" className="font-semibold text-whatsapp-deep hover:underline">
            Create your own ZAQONE.FORM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <BrandLogo />
        </div>
      </header>
      <main className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-lg rounded-3xl border border-brand-border bg-white p-6 shadow-card-lg sm:p-8">
          <PublicFormView
            title={form.title}
            description={form.description}
            ctaText={form.cta_text || "Submit via WhatsApp"}
            whatsappNumber={form.whatsapp_number}
            fields={fields}
            formId={form.id}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}
