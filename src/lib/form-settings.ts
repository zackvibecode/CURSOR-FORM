import type { FormField } from "./form-schema";
import { syncTemplateWithFields } from "./template-sync";

export type FormSettingsJson = {
  whatsapp_template?: string;
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
