import type { FieldType, FormField } from "./form-schema";
import { createDefaultField } from "./form-schema";

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  title: string;
  description_text: string;
  cta_text: string;
  fields: FormField[];
}

function buildFields(
  configs: Array<{ type: FieldType; label: string; required?: boolean; options?: string[]; placeholder?: string }>
): FormField[] {
  return configs.map((config, index) => {
    const field = createDefaultField(config.type, index);
    return {
      ...field,
      label: config.label,
      required: config.required ?? field.required,
      options: config.options ?? field.options,
      placeholder: config.placeholder ?? field.placeholder,
    };
  });
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "contact",
    name: "Contact Form",
    description: "Get general inquiries from anyone",
    icon: "📬",
    title: "Contact Us",
    description_text: "We'd love to hear from you. Fill in the form below.",
    cta_text: "Send on WhatsApp",
    fields: buildFields([
      { type: "title", label: "Get in Touch" },
      { type: "text", label: "Full Name", required: true, placeholder: "Your name" },
      { type: "email", label: "Email", required: true },
      { type: "phone", label: "Phone Number", required: true },
      { type: "textarea", label: "Message", required: true, placeholder: "How can we help?" },
    ]),
  },
  {
    id: "travel",
    name: "Travel Booking",
    description: "Collect travel requirements from customers",
    icon: "✈️",
    title: "Travel Inquiry",
    description_text: "Tell us about your dream trip!",
    cta_text: "Submit Booking Inquiry",
    fields: buildFields([
      { type: "title", label: "Plan Your Trip" },
      { type: "text", label: "Full Name", required: true },
      { type: "phone", label: "WhatsApp Number", required: true },
      { type: "dropdown", label: "Destination", required: true, options: ["Japan", "Korea", "Europe", "Local Malaysia", "Other"] },
      { type: "number", label: "Number of Travelers", required: true },
      { type: "date", label: "Preferred Travel Date", required: true },
    ]),
  },
  {
    id: "feedback",
    name: "Customer Feedback",
    description: "Collect feedback about customer experience",
    icon: "⭐",
    title: "Share Your Feedback",
    description_text: "Your feedback helps us improve.",
    cta_text: "Submit Feedback",
    fields: buildFields([
      { type: "title", label: "We Value Your Opinion" },
      { type: "text", label: "Name", required: true },
      { type: "multiple_choice", label: "Overall Rating", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { type: "textarea", label: "Comments", placeholder: "Tell us more..." },
    ]),
  },
  {
    id: "restaurant",
    name: "Restaurant Order",
    description: "Connect with customers who want to order meals",
    icon: "🍽️",
    title: "Order Now",
    description_text: "Place your order and we'll confirm on WhatsApp.",
    cta_text: "Send Order",
    fields: buildFields([
      { type: "title", label: "Place Your Order" },
      { type: "text", label: "Name", required: true },
      { type: "phone", label: "Phone Number", required: true },
      { type: "textarea", label: "Order Details", required: true, placeholder: "List items and quantities" },
      { type: "dropdown", label: "Pickup or Delivery", required: true, options: ["Pickup", "Delivery"] },
    ]),
  },
];

export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}
