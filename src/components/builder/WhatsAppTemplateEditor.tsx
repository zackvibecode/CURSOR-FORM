"use client";

import { useMemo, useState } from "react";
import type { FormField } from "@/lib/form-schema";
import {
  WHATSAPP_TEMPLATE_PRESETS,
  buildTemplatePreview,
  getTemplateableFields,
  placeholderForField,
} from "@/lib/whatsapp-template-helpers";
import { syncTemplateWithFields } from "@/lib/template-sync";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { Check, Copy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  fields: FormField[];
  compact?: boolean;
}

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(successMessage, "success");
  } catch {
    toast("Gagal copy. Cuba highlight & copy manual.", "error");
  }
}

export function WhatsAppTemplateEditor({
  value,
  onChange,
  fields,
  compact = false,
}: WhatsAppTemplateEditorProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const templateableFields = useMemo(() => getTemplateableFields(fields), [fields]);
  const preview = useMemo(() => buildTemplatePreview(value, fields), [value, fields]);

  const handleCopyPlaceholder = async (field: FormField) => {
    const text = placeholderForField(field);
    setCopiedKey(field.id);
    await copyText(text, `Copied ${text}`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = WHATSAPP_TEMPLATE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const next = syncTemplateWithFields(preset.build(fields), fields);
    onChange(next);
    toast(`Template "${preset.name}" dimasukkan`, "success");
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div>
        <Label>WhatsApp message template</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Salam/hi, saya berminat dengan pakej {{Pakej}}.\n\nNama: {{Nama}}\nNo WhatsApp: {{No WhatsApp}}`}
          className={cn("mt-1.5 font-mono text-xs", compact ? "min-h-[140px]" : "min-h-[180px]")}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-muted-fg">
          Guna placeholder <span className="font-mono text-fg">{"{{Label field}}"}</span> atau baris
          seperti <span className="font-mono text-fg">Nama:</span>. Template auto-sync bila kau ubah
          field, tapi kau masih boleh edit manual.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
          <Copy className="h-3 w-3" />
          Placeholder field (copy & paste)
        </div>
        {templateableFields.length === 0 ? (
          <p className="text-[11px] text-muted-fg">Tambah field dulu untuk dapat placeholder.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {templateableFields.map((field) => {
              const placeholder = placeholderForField(field);
              const copied = copiedKey === field.id;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => handleCopyPlaceholder(field)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-fg transition-colors hover:border-whatsapp/40 hover:bg-whatsapp/5"
                  title={`Copy ${placeholder}`}
                >
                  {copied ? <Check className="h-3 w-3 text-whatsapp" /> : <Copy className="h-3 w-3 text-muted-fg" />}
                  {placeholder}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
          <Sparkles className="h-3 w-3" />
          Contoh template siap
        </div>
        <div className="space-y-2">
          {WHATSAPP_TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.id)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:border-whatsapp/40 hover:bg-whatsapp/5"
            >
              <p className="text-xs font-medium text-fg">{preset.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-fg">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="rounded-lg border border-dashed border-whatsapp/30 bg-whatsapp/5 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-whatsapp">
            Preview (demo customer)
          </p>
          <pre className="whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-fg">
            {preview}
          </pre>
        </div>
      )}
    </div>
  );
}
