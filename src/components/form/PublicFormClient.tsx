"use client";

import { PublicFormView } from "@/components/form/PublicFormView";
import { DirectWhatsAppView } from "@/components/form/DirectWhatsAppView";
import type { DbForm } from "@/lib/database.types";
import type { FormField } from "@/lib/form-schema";
import {
  getDirectMessageFromForm,
  getTiktokModeFromForm,
  getWhatsappTemplateFromForm,
  isDirectLinkForm,
} from "@/lib/form-settings";
import type { TeamRoutingSnapshot } from "@/lib/team-routing-client";
import type { CSSProperties } from "react";

interface PublicFormClientProps {
  form: DbForm;
  fields: FormField[];
  pixelId: string | null;
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
  const effectivePixelId = pixelId || undefined;
  const isDirect = isDirectLinkForm(form);

  return (
    <div className="min-h-screen bg-bg text-fg [color-scheme:light]" style={lightFormTheme}>
      <main
        className="scroll-pb-32 px-4 py-10 pb-32 sm:py-14 sm:pb-32"
        style={{ paddingBottom: "max(8rem, env(safe-area-inset-bottom, 0px) + 6rem)" }}
      >
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {isDirect ? (
            <DirectWhatsAppView
              title={form.title}
              description={form.description}
              ctaText={form.cta_text || "Chat on WhatsApp"}
              whatsappNumber={form.whatsapp_number}
              directMessage={getDirectMessageFromForm(form)}
              tiktokMode={getTiktokModeFromForm(form)}
            />
          ) : (
            <PublicFormView
              title={form.title}
              description={form.description}
              ctaText={form.cta_text || "Submit on WhatsApp"}
              whatsappNumber={form.whatsapp_number}
              fields={fields}
              formId={form.id}
              pixelId={effectivePixelId}
              whatsappTemplate={getWhatsappTemplateFromForm(form)}
              tiktokMode={getTiktokModeFromForm(form)}
              usesTeamRouting={usesTeamRouting}
              teamRoutingSnapshot={teamRoutingSnapshot}
            />
          )}
        </div>
      </main>
    </div>
  );
}
