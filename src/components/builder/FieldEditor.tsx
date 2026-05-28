"use client";

import type { FormField } from "@/lib/form-schema";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Toggle } from "@/components/ui/Toggle";
import { OptionsFieldEditor } from "./OptionsFieldEditor";

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
      <aside className="w-72 shrink-0 overflow-auto border-l border-brand-border bg-white p-5">
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

  return (
    <aside className="w-80 shrink-0 overflow-auto border-l border-brand-border bg-white p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-muted">
        Edit {field.type === "multiple_choice"
          ? "Multiple Choice"
          : field.type === "dropdown"
            ? "Dropdown"
            : field.type === "checkbox"
              ? "Checkbox"
              : "Field"}
      </h3>

      {hasOptions ? (
        <OptionsFieldEditor field={field} onUpdate={onUpdate} />
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            />
          </div>

          {field.type !== "title" && (
            <>
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder ?? ""}
                  onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
                />
              </div>

              <Toggle
                id={`required-${field.id}`}
                label="Required field"
                checked={field.required}
                onChange={(checked) => onUpdate({ ...field, required: checked })}
              />
            </>
          )}

          {field.type === "title" && (
            <div>
              <Label>Subtitle (optional)</Label>
              <Textarea
                value={field.settings?.subtitle ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...field,
                    settings: { ...field.settings, subtitle: e.target.value },
                  })
                }
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>
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
