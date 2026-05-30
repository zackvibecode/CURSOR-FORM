"use client";

import { PublicFormView } from "@/components/form/PublicFormView";
import type { DbForm } from "@/lib/database.types";
import type { FormField } from "@/lib/form-schema";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface PublicFormClientProps {
  form: DbForm;
  fields: FormField[];
}

export function PublicFormClient({ form, fields }: PublicFormClientProps) {
  const handleSubmit = async (answers: Record<string, string>) => {
    const res = await fetch(`/api/forms/${form.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Submission failed");
    }

    return data.whatsapp_number as string | undefined;
  };

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
