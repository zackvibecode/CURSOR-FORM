"use client";

import { PublicFormView } from "@/components/form/PublicFormView";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import type { DbForm } from "@/lib/database.types";
import type { FormField } from "@/lib/form-schema";
import { getWhatsappTemplateFromForm } from "@/lib/form-settings";
import type { TeamRoutingSnapshot } from "@/lib/team-routing-client";
import type { CSSProperties } from "react";

interface PublicFormClientProps {
  form: DbForm;
  fields: FormField[];
  pixelId?: string;
  usesTeamRouting?: boolean;
  teamRoutingSnapshot?: TeamRoutingSnapshot | null;
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
  teamRoutingSnapshot = null,
}: PublicFormClientProps) {
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
            whatsappTemplate={getWhatsappTemplateFromForm(form)}
            usesTeamRouting={usesTeamRouting}
            teamRoutingSnapshot={teamRoutingSnapshot}
          />
        </div>
      </main>
    </div>
  );
}
