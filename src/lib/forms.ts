import type { DbForm, DbFormField } from "./database.types";
import type { FormField } from "./form-schema";

export function mapDbFieldToFormField(row: DbFormField): FormField {
  return {
    id: row.id,
    type: row.type as FormField["type"],
    label: row.label,
    placeholder: row.placeholder ?? undefined,
    required: row.required,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    settings: (row.settings as FormField["settings"]) ?? undefined,
  };
}

export function mapDbFormWithFields(
  form: DbForm,
  fields: DbFormField[]
) {
  return {
    ...form,
    fields: fields
      .sort((a, b) => a.order_index - b.order_index)
      .map(mapDbFieldToFormField),
  };
}

export function getAppUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export function getFormPublicUrl(slug: string) {
  return getAppUrl(`/f/${slug}`);
}
