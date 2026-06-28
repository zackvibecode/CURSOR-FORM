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
      <aside className="w-full shrink-0 overflow-auto border-t border-border bg-card p-5 lg:w-80 lg:border-t-0 lg:border-l scrollbar-thin">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
          Field settings
        </h3>
        <p className="text-sm text-muted-fg">
          Select a field to edit its properties, or configure the WhatsApp message template below.
        </p>

        {onWhatsappTemplateChange && (
          <div className="mt-6 space-y-4">
            <div>
              <Label>WhatsApp message template</Label>
              <Textarea
                value={whatsappTemplate ?? ""}
                onChange={(e) => onWhatsappTemplateChange(e.target.value)}
                placeholder="Hi, I would like to submit my details:&#10;Name: {{name}}&#10;Phone: {{phone}}"
                className="min-h-[160px] font-mono text-xs"
              />
              <p className="mt-2 text-[11px] text-muted-fg">
                Customize the message sent to WhatsApp. Use lines like
                {" "}Name: / Phone: or placeholders like {"{{Your name}}"}.
              </p>
            </div>
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
          <Label>WhatsApp message template</Label>
          <Textarea
            value={whatsappTemplate ?? ""}
            onChange={(e) => onWhatsappTemplateChange(e.target.value)}
            className="min-h-[120px] font-mono text-xs"
          />
          <p className="mt-2 text-[11px] text-muted-fg">
            Lines like Name: and Phone: will auto-fill from submitted answers.
            You can also use {"{{Field label}}"} placeholders.
          </p>
        </div>
      )}
    </aside>
  );
}
