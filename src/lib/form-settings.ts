import type { FormField } from "./form-schema";
import { syncTemplateWithFields } from "./template-sync";

export type FormSettingsJson = {
  whatsapp_template?: string;
  /** When true, TikTok in-app browser shows manual WhatsApp open screen after submit. */
  tiktok_mode?: boolean;
  [key: string]: unknown;
};

function parseSettingsObject(raw: unknown): FormSettingsJson {
  if (!raw) return {};

  if (typeof raw === "string") {
    try {
      return parseSettingsObject(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as FormSettingsJson;
  }

  return {};
}

export function getWhatsappTemplateFromForm(form: {
  settings?: unknown;
}): string | undefined {
  const settings = parseSettingsObject(form.settings);
  const template = settings.whatsapp_template;
  return typeof template === "string" && template.trim() ? template : undefined;
}

/** TikTok mode defaults ON so bio/ads forms work; turn off for normal browser-only traffic. */
export function getTiktokModeFromForm(form: { settings?: unknown }): boolean {
  const settings = parseSettingsObject(form.settings);
  return settings.tiktok_mode !== false;
}

export function getInitialWhatsappTemplate(
  saved: string | undefined,
  fields: FormField[]
): string {
  if (saved?.trim()) return saved;
  return syncTemplateWithFields("", fields);
}

export function mergeFormSettings(
  existing: unknown,
  incoming: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (incoming === undefined) return undefined;
  return { ...parseSettingsObject(existing), ...incoming };
}

export function fieldsStructureKey(fields: FormField[]): string {
  return fields.map((field) => `${field.id}:${field.label}:${field.type}`).join("|");
}
