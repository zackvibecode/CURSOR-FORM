import type { FormField } from "./form-schema";

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppMessage(
  formTitle: string,
  fields: FormField[],
  answers: Record<string, string>
): string {
  const lines = [`*New Lead — ${formTitle}*`, ""];

  fields.forEach((field) => {
    if (field.type === "title") return;
    const answer = answers[field.id];
    if (answer && answer.trim()) {
      lines.push(`${field.label}: ${answer.trim()}`);
    }
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
