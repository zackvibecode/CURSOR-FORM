"use client";

import type { FormField } from "@/lib/form-schema";
import { ArrowLeft, Trash2 } from "lucide-react";
import { OptionsFieldEditor, StandardFieldEditor } from "./OptionsFieldEditor";
import { WhatsAppTemplateEditor } from "./WhatsAppTemplateEditor";

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
  fields: FormField[];
  onUpdate: (field: FormField) => void;
  whatsappTemplate?: string;
  onWhatsappTemplateChange?: (value: string) => void;
  drawer?: boolean;
  onBack?: () => void;
  onDelete?: () => void;
}

export function FieldEditor({
  field,
  fields,
  onUpdate,
  whatsappTemplate,
  onWhatsappTemplateChange,
  drawer = false,
  onBack,
  onDelete,
}: FieldEditorProps) {
  if (!field) {
    return (
      <aside className="w-full shrink-0 overflow-auto border-t border-border bg-card p-5 lg:w-80 lg:border-t-0 lg:border-l scrollbar-thin">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
          Field settings
        </h3>
        <p className="text-sm text-muted-fg">
          Select a field to edit its properties, or configure the WhatsApp message template below.
        </p>

        {onWhatsappTemplateChange && (
          <div className="mt-6">
            <WhatsAppTemplateEditor
              value={whatsappTemplate ?? ""}
              onChange={onWhatsappTemplateChange}
              fields={fields}
            />
          </div>
        )}
      </aside>
    );
  }

  const hasOptions = ["dropdown", "multiple_choice", "checkbox"].includes(field.type);
  const fieldLabel = FIELD_LABELS[field.type] ?? "Field";

  if (drawer) {
    return (
      <div className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-fg transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
            Edit {fieldLabel}
          </span>
          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-4" />
          )}
        </div>
        <div className="flex-1 overflow-auto p-5 scrollbar-thin">
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
    <aside className="w-80 shrink-0 overflow-auto border-l border-border bg-card p-5 scrollbar-thin">
      <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
        Edit {fieldLabel}
      </h3>

      {hasOptions ? (
        <OptionsFieldEditor field={field} onUpdate={onUpdate} />
      ) : (
        <StandardFieldEditor field={field} onUpdate={onUpdate} />
      )}

      {onWhatsappTemplateChange && (
        <div className="mt-6 border-t border-border pt-4">
          <WhatsAppTemplateEditor
            value={whatsappTemplate ?? ""}
            onChange={onWhatsappTemplateChange}
            fields={fields}
            compact
          />
        </div>
      )}
    </aside>
  );
}
