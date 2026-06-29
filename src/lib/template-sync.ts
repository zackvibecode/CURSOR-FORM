import type { FormField } from "./form-schema";

const FIELD_LINE_RE = /^(\s*(?:[-*]\s*)?)([^:\n]+):\s*$/;

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelAliases(label: string): string[] {
  const trimmed = label.trim();
  const withoutPrefix = trimmed.replace(/^(your|customer|client)\s+/i, "");
  const withoutSuffix = trimmed.replace(/\s+(number|address)$/i, "");
  const withoutBoth = withoutPrefix.replace(/\s+(number|address)$/i, "");

  return [trimmed, withoutPrefix, withoutSuffix, withoutBoth].filter(
    (v, i, arr) => v && arr.indexOf(v) === i
  );
}

const TEMPLATEABLE_TYPES = new Set([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "dropdown",
  "multiple_choice",
  "checkbox",
  "date",
]);

/**
 * Merge a WhatsApp message template with the current form fields.
 *
 * - Lines that match an existing field label are kept.
 * - Lines that no longer match any field are removed.
 * - Fields without a matching line are appended as "Label:".
 * - Custom lines (greeting, intro, blank lines) are preserved in place.
 * - title and image field types are skipped (not part of the message).
 *
 * If the template is empty, a default one is generated from the fields.
 */
export function syncTemplateWithFields(
  template: string,
  fields: FormField[]
): string {
  const templateable = fields.filter((f) => TEMPLATEABLE_TYPES.has(f.type));

  const fieldKeyToLabel = new Map<string, string>();
  templateable.forEach((field) => {
    labelAliases(field.label).forEach((alias) => {
      const key = normalizeKey(alias);
      if (key && !fieldKeyToLabel.has(key)) {
        fieldKeyToLabel.set(key, field.label);
      }
    });
  });

  if (!template || !template.trim()) {
    return templateable.map((f) => `${f.label}:`).join("\n");
  }

  const seenKeys = new Set<string>();
  const keptLines: string[] = [];

  const lines = template.split("\n");
  for (const line of lines) {
    const match = line.match(FIELD_LINE_RE);
    if (!match) {
      keptLines.push(line);
      continue;
    }

    const [, , rawLabel] = match;
    const key = normalizeKey(rawLabel);

    if (key && fieldKeyToLabel.has(key)) {
      seenKeys.add(key);
      keptLines.push(line);
    }
  }

  const missingFields = templateable.filter((field) => {
    return !labelAliases(field.label).some((alias) =>
      seenKeys.has(normalizeKey(alias))
    );
  });

  if (missingFields.length === 0) {
    return keptLines.join("\n");
  }

  const hasContent = keptLines.some((l) => l.trim());
  const result = [...keptLines];

  if (hasContent && result[result.length - 1]?.trim() !== "") {
    result.push("");
  }

  missingFields.forEach((field) => {
    result.push(`${field.label}:`);
  });

  return result.join("\n");
}
