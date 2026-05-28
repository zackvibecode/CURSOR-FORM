"use client";

import type { FormField } from "@/lib/form-schema";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { OptionsFieldEditor, StandardFieldEditor } from "./OptionsFieldEditor";

const FIELD_LABELS: Record<string, string> = {
  text: "Text Input",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  textarea: "Long Answer",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkbox",
  title: "Title",
  image: "Image",
};

interface FieldEditorProps {
  field: FormField | null;
  onUpdate: (field: FormField) => void;
  whatsappTemplate?: string;
  onWhatsappTemplateChange?: (value: string) => void;
}

export function FieldEditor({
  field,
  onUpdate,
  whatsappTemplate,
  onWhatsappTemplateChange,
}: FieldEditorProps) {
  if (!field) {
    return (
      <aside className="w-80 shrink-0 overflow-auto border-l border-brand-border bg-white p-5">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
          Field Settings
        </h3>
        <p className="text-sm text-brand-muted">
          Select a field to edit its properties, or configure the WhatsApp message template below.
        </p>

        {onWhatsappTemplateChange && (
          <div className="mt-6 space-y-4">
            <div>
              <Label>WhatsApp Message Template</Label>
              <Textarea
                value={whatsappTemplate ?? ""}
                onChange={(e) => onWhatsappTemplateChange(e.target.value)}
                placeholder="Hi, I would like to submit my details:&#10;Name: {{name}}&#10;Phone: {{phone}}"
                className="min-h-[160px] font-mono text-xs"
              />
              <p className="mt-2 text-xs text-brand-muted">
                Customize the message sent to WhatsApp when a form is submitted.
              </p>
            </div>
          </div>
        )}
      </aside>
    );
  }

  const hasOptions = ["dropdown", "multiple_choice", "checkbox"].includes(field.type);
  const fieldLabel = FIELD_LABELS[field.type] ?? "Field";

  return (
    <aside className="w-80 shrink-0 overflow-auto border-l border-brand-border bg-white p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-muted">
        Edit {fieldLabel}
      </h3>

      {hasOptions ? (
        <OptionsFieldEditor field={field} onUpdate={onUpdate} />
      ) : (
        <StandardFieldEditor field={field} onUpdate={onUpdate} />
      )}

      {onWhatsappTemplateChange && (
        <div className="mt-6 border-t border-brand-border pt-4">
          <Label>WhatsApp Message Template</Label>
          <Textarea
            value={whatsappTemplate ?? ""}
            onChange={(e) => onWhatsappTemplateChange(e.target.value)}
            className="min-h-[120px] font-mono text-xs"
          />
        </div>
      )}
    </aside>
  );
}
