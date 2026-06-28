import type { FormField } from "./form-schema";

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Remove characters/spacing that break WhatsApp *bold* formatting. */
function sanitizeWhatsAppText(text: string): string {
  return text
    .trim()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .replace(/[\u2013\u2014]/g, "-");
}

/** Wrap text in WhatsApp bold markers with no extra whitespace inside. */
function whatsappBold(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return `*${trimmed}*`;
}

/** Format a field label for WhatsApp bold, e.g. *Your name:* */
function formatWhatsAppBoldLabel(label: string): string {
  const cleanLabel = sanitizeWhatsAppText(label);

  if (/:\s*$/.test(cleanLabel)) {
    return whatsappBold(cleanLabel);
  }

  return whatsappBold(`${cleanLabel}:`);
}

export function buildWhatsAppMessage(
  formTitle: string,
  fields: FormField[],
  answers: Record<string, string>
): string {
  const cleanTitle = sanitizeWhatsAppText(formTitle);
  const lines = [whatsappBold(`New Lead - ${cleanTitle}`), ""];

  fields.forEach((field) => {
    if (field.type === "title") return;

    const answer = answers[field.id]?.trim();
    if (!answer) return;

    lines.push(`${formatWhatsAppBoldLabel(field.label)} ${answer}`);
  });

  return lines.join("\n");
}

/**
 * Build a message from a custom template. Placeholders written as
 * {{Field Label}} are replaced with the matching answer (case-insensitive,
 * trimmed). Unmatched placeholders are removed so no raw {{...}} leaks to
 * WhatsApp. Returns null when the template is empty so callers can fall back
 * to the auto-generated message.
 */
export function buildWhatsAppMessageFromTemplate(
  template: string,
  fields: FormField[],
  answers: Record<string, string>
): string | null {
  if (!template || !template.trim()) return null;

  const normalizeKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const addAnswerKey = (map: Map<string, string>, key: string, answer: string) => {
    const normalized = normalizeKey(key);
    if (normalized && !map.has(normalized)) {
      map.set(normalized, answer);
    }
  };

  // Map flexible label aliases -> answer. This lets templates use either
  // {{Your name}} placeholders or plain lines like "Name:" / "Phone:".
  const labelToAnswer = new Map<string, string>();
  fields.forEach((field) => {
    if (field.type === "title") return;
    const answer = answers[field.id]?.trim();
    if (answer) {
      const label = field.label.trim();
      addAnswerKey(labelToAnswer, label, answer);

      const withoutCommonPrefix = label.replace(/^(your|customer|client)\s+/i, "");
      addAnswerKey(labelToAnswer, withoutCommonPrefix, answer);

      // Common form labels often include a suffix, but templates use the short
      // version (e.g. "Phone:" instead of "Phone number:").
      addAnswerKey(labelToAnswer, label.replace(/\s+(number|address)$/i, ""), answer);
      addAnswerKey(labelToAnswer, withoutCommonPrefix.replace(/\s+(number|address)$/i, ""), answer);

      if (field.type === "email") addAnswerKey(labelToAnswer, "email", answer);
      if (field.type === "phone") addAnswerKey(labelToAnswer, "phone", answer);
      if (field.type === "date") {
        addAnswerKey(labelToAnswer, "date", answer);
        addAnswerKey(labelToAnswer, "preferred date", answer);
      }
      if (field.type === "textarea") addAnswerKey(labelToAnswer, "message", answer);
    }
  });

  const withPlaceholders = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey) => {
    const key = normalizeKey(String(rawKey));
    return labelToAnswer.get(key) ?? "";
  });

  const filled = withPlaceholders
    .split("\n")
    .map((line) => {
      const emptyLabelMatch = line.match(/^(\s*(?:[-*]\s*)?)([^:\n]+):\s*$/);
      if (!emptyLabelMatch) return line;

      const [, prefix, rawLabel] = emptyLabelMatch;
      const answer = labelToAnswer.get(normalizeKey(rawLabel));
      return answer ? `${prefix}${rawLabel}: ${answer}` : line;
    })
    .join("\n");

  // Collapse blank lines left by removed placeholders, then sanitize
  return filled
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildWhatsAppUrl(
  phone: string,
  formTitle: string,
  fields: FormField[],
  answers: Record<string, string>,
  template?: string | null
): string {
  const templated = buildWhatsAppMessageFromTemplate(template ?? "", fields, answers);
  const message = templated ?? buildWhatsAppMessage(formTitle, fields, answers);
  const text = encodeURIComponent(message);
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
