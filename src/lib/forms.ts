import type { DbForm, DbFormField } from "./database.types";
import type { FormField, FieldType } from "./form-schema";
import { FIELD_TYPES } from "./form-schema";

const VALID_FIELD_TYPES = new Set(FIELD_TYPES);

export function mapDbFieldToFormField(row: DbFormField): FormField {
  const validatedType: FieldType = VALID_FIELD_TYPES.has(row.type as FieldType)
    ? (row.type as FieldType)
    : "text";

  return {
    id: row.id,
    type: validatedType,
    label: row.label,
    placeholder: row.placeholder ?? undefined,
    required: row.required,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    settings: typeof row.settings === "object" && row.settings !== null && !Array.isArray(row.settings)
      ? (row.settings as FormField["settings"])
      : undefined,
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
