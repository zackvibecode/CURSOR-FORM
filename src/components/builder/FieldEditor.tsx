"use client";

import type { FormField } from "@/lib/form-schema";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
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
  drawer?: boolean;
  onBack?: () => void;
  onDelete?: () => void;
}

export function FieldEditor({
  field,
  onUpdate,
  whatsappTemplate,
  onWhatsappTemplateChange,
  drawer = false,
  onBack,
  onDelete,
}: FieldEditorProps) {
  if (!field) {
    return (
      <aside className="w-full shrink-0 overflow-auto border-t border-brand-border bg-white p-5 lg:w-80 lg:border-t-0 lg:border-l">
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

  // Drawer mode (mobile): full-screen panel with Back + Delete header
  if (drawer) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Edit {fieldLabel}
          </span>
          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-sm font-medium text-brand-red hover:underline"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-4" />
          )}
        </div>
        <div className="flex-1 overflow-auto p-5">
          {hasOptions ? (
            <OptionsFieldEditor field={field} onUpdate={onUpdate} />
          ) : (
            <StandardFieldEditor field={field} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    );
  }

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
