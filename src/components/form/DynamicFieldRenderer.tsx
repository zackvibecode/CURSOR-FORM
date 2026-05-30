"use client";

import type { FormField } from "@/lib/form-schema";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DynamicFieldRendererProps {
  fields: FormField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  errors?: Record<string, string>;
  preview?: boolean;
}

export function DynamicFieldRenderer({
  fields,
  values,
  onChange,
  errors = {},
  preview = false,
}: DynamicFieldRendererProps) {
  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const align = field.settings?.align ?? "left";
        const alignClass =
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
        const justifyClass =
          align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

        if (field.type === "title") {
          const isHeadline = field.settings?.size === "headline";
          const isBold = field.settings?.bold ?? true;
          return (
            <div key={field.id} className={cn("pt-2", alignClass)}>
              <h2
                className={cn(
                  "text-gray-900",
                  isHeadline ? "text-3xl" : "text-xl",
                  isBold ? "font-bold" : "font-normal"
                )}
              >
                {field.label}
              </h2>
              {field.settings?.subtitle && (
                <p className="mt-1 text-sm text-gray-600">{field.settings.subtitle}</p>
              )}
            </div>
          );
        }

        if (field.type === "image") {
          if (!field.settings?.imageUrl) {
            return preview ? (
              <div
                key={field.id}
                className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-10 text-sm text-gray-400"
              >
                No image uploaded yet
              </div>
            ) : null;
          }
          return (
            <div key={field.id} className={cn("flex", justifyClass)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={field.settings.imageUrl}
                alt={field.settings.imageAlt ?? field.label ?? "Form image"}
                className="max-h-80 max-w-full rounded-xl object-contain"
              />
            </div>
          );
        }

        const error = errors[field.id];
        const value = values[field.id] ?? "";

        return (
          <div key={field.id}>
            <Label>
              {field.label}
              {field.required && <span className="text-brand-red"> *</span>}
            </Label>

            {field.type === "textarea" ? (
              <Textarea
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={preview}
              />
            ) : field.type === "multiple_choice" ? (
              <div className="space-y-1.5 pt-1">
                {(field.options ?? []).map((opt) => {
                  const selected = value === opt;
                  return (
                    <label
                      key={opt}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 transition-colors hover:border-whatsapp",
                        selected && "border-whatsapp bg-whatsapp/5"
                      )}
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={selected}
                        onChange={() => onChange(field.id, opt)}
                        disabled={preview}
                        className="accent-whatsapp"
                      />
                      <span className="text-sm text-brand-text">{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : field.type === "dropdown" ? (
              <div className="relative">
                <select
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  disabled={preview}
                  className={cn(
                    "w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 outline-none focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20",
                    error && "border-brand-red"
                  )}
                >
                  <option value="">Select an option</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            ) : field.type === "checkbox" ? (
              <div className="space-y-2">
                {(field.options ?? []).map((opt) => {
                  const selected = value ? value.split(", ") : [];
                  const checked = selected.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:border-whatsapp",
                        checked && "border-whatsapp bg-whatsapp/5"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selected, opt]
                            : selected.filter((s) => s !== opt);
                          onChange(field.id, next.join(", "));
                        }}
                        disabled={preview}
                        className="accent-whatsapp"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : (
              <Input
                type={
                  field.type === "email"
                    ? "email"
                    : field.type === "phone"
                      ? "tel"
                      : field.type === "number"
                        ? "number"
                        : field.type === "date"
                          ? "date"
                          : "text"
                }
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={preview}
                className={error ? "border-brand-red" : ""}
              />
            )}

            {error && <p className="mt-1 text-sm text-brand-red">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
