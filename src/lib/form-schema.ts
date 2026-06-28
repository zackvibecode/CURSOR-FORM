import { z } from "zod";

export const FIELD_TYPES = [
  "title",
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "dropdown",
  "multiple_choice",
  "checkbox",
  "date",
  "image",
] as const;

export const FORM_FIELD_TYPES = FIELD_TYPES;
export type FieldType = (typeof FIELD_TYPES)[number];

export const formFieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  settings: z
    .object({
      multiline: z.boolean().optional(),
      subtitle: z.string().optional(),
      imageUrl: z.string().optional(),
      imageAlt: z.string().optional(),
      imageSize: z.enum(["fit", "medium", "full"]).optional(),
      align: z.enum(["left", "center", "right"]).optional(),
      bold: z.boolean().optional(),
      size: z.enum(["normal", "headline"]).optional(),
    })
    .optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const formSettingsSchema = z.object({
  title: z.string().min(1, "Form title is required"),
  description: z.string().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  whatsapp_number: z
    .string()
    .min(8, "WhatsApp number is required")
    .regex(/^\+?[0-9\s-]+$/, "Enter a valid phone number"),
  cta_text: z.string().min(1).default("Submit on WhatsApp"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type FormSettings = z.infer<typeof formSettingsSchema>;

export const formUpdateBodySchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  whatsapp_number: z
    .string()
    .min(8)
    .regex(/^\+?[0-9\s-]+$/)
    .optional(),
  cta_text: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  settings: z.record(z.unknown()).optional(),
  fields: z.array(formFieldSchema).optional(),
});

export const formSchema = formSettingsSchema.extend({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  fields: z.array(formFieldSchema),
});

export type Form = z.infer<typeof formSchema>;

export function createDefaultField(type: FieldType, orderIndex: number): FormField {
  const id = crypto.randomUUID();
  const defaults: Record<FieldType, Partial<FormField>> = {
    title: { label: "Welcome!", required: false },
    text: { label: "Your name", placeholder: "Enter your name", required: true },
    textarea: { label: "Your message", placeholder: "Tell us more...", required: false },
    email: { label: "Email address", placeholder: "you@example.com", required: true },
    phone: { label: "Phone number", placeholder: "+60123456789", required: true },
    number: { label: "Quantity", placeholder: "1", required: false },
    dropdown: {
      label: "Select an option",
      required: true,
      options: ["Option 1", "Option 2", "Option 3"],
    },
    multiple_choice: {
      label: "Choose one",
      required: true,
      options: ["Option A", "Option B", "Option C"],
    },
    checkbox: {
      label: "Select all that apply",
      required: false,
      options: ["Option 1", "Option 2"],
    },
    date: { label: "Preferred date", required: false },
    image: { label: "Image", required: false, settings: { align: "center", imageSize: "medium" } },
  };

  return formFieldSchema.parse({
    id,
    type,
    required: false,
    ...defaults[type],
  });
}

export function buildAnswersSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    if (field.type === "title") return;

    let schema: z.ZodTypeAny = z.string();
    let isOptionsField = false;

    if (field.type === "email") {
      schema = z.string().email("Enter a valid email");
    } else if (field.type === "number") {
      schema = z.string().regex(/^\d+(\.\d+)?$/, "Enter a valid number");
    } else if (field.type === "checkbox") {
      schema = z.string().optional();
    } else if (field.type === "dropdown" && field.options && field.options.length > 0) {
      isOptionsField = true;
      schema = z.enum(field.options as [string, ...string[]], {
        errorMap: () => ({ message: `Please select a valid option` }),
      });
    } else if (field.type === "multiple_choice" && field.options && field.options.length > 0) {
      isOptionsField = true;
      schema = z.string().refine((val) => field.options!.includes(val), {
        message: `Please select a valid option`,
      });
    }

    if (!field.required) {
      schema = schema.optional();
    } else if (field.type !== "checkbox") {
      if (isOptionsField) {
        schema = schema.refine((val) => val && val.trim().length > 0, {
          message: `${field.label} is required`,
        });
      } else {
        schema = (schema as z.ZodString).min(1, `${field.label} is required`);
      }
    }

    shape[field.id] = schema;
  });

  return z.object(shape);
}
