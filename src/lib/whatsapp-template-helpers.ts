import type { FieldType, FormField } from "./form-schema";
import { buildWhatsAppMessageFromTemplate } from "./whatsapp";

const TEMPLATEABLE_TYPES = new Set<FieldType>([
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

export function getTemplateableFields(fields: FormField[]): FormField[] {
  return fields.filter((field) => TEMPLATEABLE_TYPES.has(field.type));
}

export function placeholderForField(field: FormField): string {
  return `{{${field.label}}}`;
}

function findField(
  fields: FormField[],
  options: { types?: FieldType[]; labelMatch?: RegExp }
): FormField | undefined {
  const templateable = getTemplateableFields(fields);

  if (options.labelMatch) {
    const byLabel = templateable.find((field) => options.labelMatch!.test(field.label));
    if (byLabel) return byLabel;
  }

  if (options.types?.length) {
    return templateable.find((field) => options.types!.includes(field.type));
  }

  return undefined;
}

function ph(field: FormField | undefined, fallback: string): string {
  return field ? placeholderForField(field) : fallback;
}

export interface WhatsAppTemplatePreset {
  id: string;
  name: string;
  description: string;
  build: (fields: FormField[]) => string;
}

export const WHATSAPP_TEMPLATE_PRESETS: WhatsAppTemplatePreset[] = [
  {
    id: "travel-malay",
    name: "Salam + berminat pakej",
    description: "Sesuai travel / pakej pelancongan",
    build: (fields) => {
      const packageField = findField(fields, {
        types: ["multiple_choice", "dropdown"],
        labelMatch: /pakej|package|destinasi|destination|pelancongan|trip/i,
      });
      const nameField = findField(fields, {
        types: ["text"],
        labelMatch: /nama|name/i,
      });
      const phoneField = findField(fields, { types: ["phone"] });

      const lines = [
        `Salam/hi, saya berminat dengan pakej ${ph(packageField, "{{Pakej}}")}.`,
        "",
        nameField ? `${nameField.label}: ${ph(nameField, "{{Nama}}")}` : "Nama: {{Nama}}",
        phoneField
          ? `${phoneField.label}: ${ph(phoneField, "{{No WhatsApp}}")}`
          : "No WhatsApp: {{No WhatsApp}}",
      ];

      getTemplateableFields(fields).forEach((field) => {
        if (field.id === packageField?.id || field.id === nameField?.id || field.id === phoneField?.id) {
          return;
        }
        lines.push(`${field.label}:`);
      });

      return lines.join("\n");
    },
  },
  {
    id: "simple-malay",
    name: "Ringkas (BM)",
    description: "Salam pendek + semua field",
    build: (fields) => {
      const lines = ["Salam/hi, saya nak hantar maklumat ini:", ""];
      getTemplateableFields(fields).forEach((field) => {
        lines.push(`${field.label}:`);
      });
      return lines.join("\n");
    },
  },
  {
    id: "english-inquiry",
    name: "English inquiry",
    description: "Professional English message",
    build: (fields) => {
      const serviceField = findField(fields, {
        types: ["dropdown", "multiple_choice"],
        labelMatch: /service|pakej|package|product|plan/i,
      });
      const nameField = findField(fields, {
        types: ["text"],
        labelMatch: /name/i,
      });
      const phoneField = findField(fields, { types: ["phone"] });
      const emailField = findField(fields, { types: ["email"] });

      const lines = [
        `Hi, I would like to inquire about ${ph(serviceField, "{{Service}}")}.`,
        "",
        nameField ? `${nameField.label}: ${ph(nameField, "{{Name}}")}` : "Name: {{Name}}",
        phoneField ? `${phoneField.label}: ${ph(phoneField, "{{Phone}}")}` : "Phone: {{Phone}}",
      ];

      if (emailField) {
        lines.push(`${emailField.label}: ${ph(emailField, "{{Email}}")}`);
      }

      getTemplateableFields(fields).forEach((field) => {
        if ([serviceField?.id, nameField?.id, phoneField?.id, emailField?.id].includes(field.id)) {
          return;
        }
        lines.push(`${field.label}:`);
      });

      return lines.join("\n");
    },
  },
];

function demoValueForField(field: FormField): string {
  switch (field.type) {
    case "email":
      return "ahmad@email.com";
    case "phone":
      return "0123456789";
    case "number":
      return "2";
    case "date":
      return "15/08/2026";
    case "dropdown":
    case "multiple_choice":
      return field.options?.[0] ?? "Pilihan 1";
    case "checkbox":
      return field.options?.slice(0, 2).join(", ") || "Pilihan";
    case "textarea":
      return "Saya nak tanya lanjut tentang pakej ini.";
    default:
      if (/nama|name/i.test(field.label)) return "Ahmad";
      if (/pakej|package|destinasi|destination/i.test(field.label)) {
        return field.options?.[0] ?? "ID Makassar";
      }
      return "Contoh jawapan";
  }
}

export function buildDemoAnswers(fields: FormField[]): Record<string, string> {
  const answers: Record<string, string> = {};
  getTemplateableFields(fields).forEach((field) => {
    answers[field.id] = demoValueForField(field);
  });
  return answers;
}

export function buildTemplatePreview(
  template: string,
  fields: FormField[]
): string | null {
  if (!template.trim()) return null;
  return buildWhatsAppMessageFromTemplate(template, fields, buildDemoAnswers(fields));
}
