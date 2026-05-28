import type { FormField } from "./form-schema";

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Remove characters/spacing that break WhatsApp *bold* formatting. */
function sanitizeWhatsAppText(text: string): string {
  return text
    .trim()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ");
}

/** Format a field label for WhatsApp bold, e.g. *Your name:* */
function formatWhatsAppBoldLabel(label: string): string {
  const cleanLabel = sanitizeWhatsAppText(label);

  // Label already includes trailing colon — keep spacing inside bold markers.
  if (/:\s*$/.test(cleanLabel)) {
    return `*${cleanLabel}*`;
  }

  return `*${cleanLabel}:*`;
}

export function buildWhatsAppMessage(
  formTitle: string,
  fields: FormField[],
  answers: Record<string, string>
): string {
  const cleanTitle = sanitizeWhatsAppText(formTitle);
  const lines = [`*New Lead — ${cleanTitle}*`, ""];

  fields.forEach((field) => {
    if (field.type === "title") return;

    const answer = answers[field.id]?.trim();
    if (!answer) return;

    lines.push(`${formatWhatsAppBoldLabel(field.label)} ${answer}`);
  });

  return lines.join("\n");
}

export function buildWhatsAppUrl(
  phone: string,
  formTitle: string,
  fields: FormField[],
  answers: Record<string, string>
): string {
  const message = buildWhatsAppMessage(formTitle, fields, answers);
  const text = encodeURIComponent(message);
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
