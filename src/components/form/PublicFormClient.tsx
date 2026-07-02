"use client";

import { PublicFormView } from "@/components/form/PublicFormView";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import type { DbForm } from "@/lib/database.types";
import type { FormField } from "@/lib/form-schema";
import type { CSSProperties } from "react";

interface PublicFormClientProps {
  form: DbForm;
  fields: FormField[];
  pixelId?: string;
  usesTeamRouting?: boolean;
}

const lightFormTheme = {
  "--bg": "#fafafa",
  "--fg": "#0a0a0a",
  "--card": "#ffffff",
  "--border": "#e5e5e5",
  "--muted": "#f5f5f5",
  "--muted-fg": "#666666",
} as CSSProperties;

export function PublicFormClient({
  form,
  fields,
  pixelId,
  usesTeamRouting = false,
}: PublicFormClientProps) {
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
    <div className="min-h-screen bg-bg text-fg [color-scheme:light]" style={lightFormTheme}>
      {pixelId && <MetaPixel pixelId={pixelId} />}
      <main className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <PublicFormView
            title={form.title}
            description={form.description}
            ctaText={form.cta_text || "Submit on WhatsApp"}
            whatsappNumber={form.whatsapp_number}
            fields={fields}
            formId={form.id}
            pixelId={pixelId}
            whatsappTemplate={
              (form.settings as { whatsapp_template?: string } | null)?.whatsapp_template
            }
            usesTeamRouting={usesTeamRouting}
            onSubmit={usesTeamRouting ? handleSubmit : undefined}
          />
        </div>
      </main>
    </div>
  );
}
