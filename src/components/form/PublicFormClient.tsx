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
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <BrandLogo />
        </div>
      </header>
      <main className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg dark:shadow-none sm:p-8">
          <PublicFormView
            title={form.title}
            description={form.description}
            ctaText={form.cta_text || "Submit via WhatsApp"}
            whatsappNumber={form.whatsapp_number}
            fields={fields}
            formId={form.id}
            whatsappTemplate={
              (form.settings as { whatsapp_template?: string } | null)?.whatsapp_template
            }
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}
