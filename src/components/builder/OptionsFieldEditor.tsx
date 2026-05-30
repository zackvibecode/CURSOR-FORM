"use client";

import { useState } from "react";
import type { FormField } from "@/lib/form-schema";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Plus,
  Bold,
  Italic,
  Link as LinkIcon,
  HelpCircle,
  AlignLeft as AlignLeftIcon,
  AlignCenter,
  AlignRight,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

interface FieldLabelProps {
  children: React.ReactNode;
}

function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-muted">
      {children}
      <HelpCircle className="h-3 w-3 text-gray-300" />
    </Label>
  );
}

interface RichTextToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function RichTextToolbar({ value, onChange, placeholder = "Add description text here" }: RichTextToolbarProps) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-1 rounded-t-xl border border-b-0 border-brand-border bg-gray-50 px-2 py-1.5">
        <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700" title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-b-xl border border-t-0 border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
        rows={2}
      />
    </div>
  );
}

type Align = "left" | "center" | "right";

function AlignmentControl({
  value,
  onChange,
}: {
  value: Align;
  onChange: (a: Align) => void;
}) {
  const options: { key: Align; icon: typeof AlignLeftIcon; label: string }[] = [
    { key: "left", icon: AlignLeftIcon, label: "Left" },
    { key: "center", icon: AlignCenter, label: "Center" },
    { key: "right", icon: AlignRight, label: "Right" },
  ];
  return (
    <div className="mt-1 inline-flex rounded-xl border border-brand-border bg-gray-50 p-1">
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={label}
          className={cn(
            "flex h-8 w-9 items-center justify-center rounded-lg transition-colors",
            value === key
              ? "bg-white text-whatsapp-deep shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function ImageUploader({
  field,
  onUpdate,
}: {
  field: FormField;
  onUpdate: (field: FormField) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const imageUrl = field.settings?.imageUrl ?? "";

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${field.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("form-images")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("form-images").getPublicUrl(path);
      onUpdate({
        ...field,
        settings: { ...field.settings, imageUrl: data.publicUrl },
      });
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div>
      <FieldLabel>Image</FieldLabel>
      {imageUrl ? (
        <div className="mt-1 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className="max-h-40 w-full rounded-xl border border-brand-border object-contain"
          />
          <button
            type="button"
            onClick={() =>
              onUpdate({ ...field, settings: { ...field.settings, imageUrl: "" } })
            }
            className="flex items-center gap-1.5 text-sm text-brand-red hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove image
          </button>
        </div>
      ) : (
        <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-border bg-gray-50 px-4 py-8 text-center transition-colors hover:border-whatsapp hover:bg-whatsapp/5">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-whatsapp" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
          <span className="text-sm font-medium text-brand-muted">
            {uploading ? "Uploading..." : "Click to upload an image"}
          </span>
          <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
      {error && <p className="mt-1 text-sm text-brand-red">{error}</p>}
    </div>
  );
}

interface OptionsFieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
}

export function OptionsFieldEditor({ field, onUpdate }: OptionsFieldEditorProps) {
  const options = field.options ?? [];

  const addOption = () => {
    onUpdate({ ...field, options: [...options, `Option ${options.length + 1}`] });
  };

  const removeOption = (index: number) => {
    onUpdate({ ...field, options: options.filter((_, i) => i !== index) });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate({ ...field, options: newOptions });
  };

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ ...field, label: e.target.value })}
          placeholder="Enter your question"
          className="mt-1"
        />
      </div>

      <div>
        <FieldLabel>Subtitle</FieldLabel>
        <RichTextToolbar
          value={field.settings?.subtitle ?? ""}
          onChange={(v) => onUpdate({ ...field, settings: { ...field.settings, subtitle: v } })}
        />
      </div>

      <div>
        <FieldLabel>Options</FieldLabel>
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <button type="button" className="cursor-grab text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Drag to reorder">
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <Input value={option} onChange={(e) => updateOption(index, e.target.value)} className="text-sm" placeholder={`Option ${index + 1}`} />
              </div>
              <span className="text-[10px] text-gray-300 w-3 text-center font-mono">{index}</span>
              <button type="button" onClick={() => removeOption(index)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-opacity" title="Remove option">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors">
            <Plus className="h-4 w-4" />
            Add option
          </button>
        </div>
      </div>
    </div>
  );
}

interface StandardFieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
}

export function StandardFieldEditor({ field, onUpdate }: StandardFieldEditorProps) {
  const align: Align = field.settings?.align ?? "left";
  const setAlign = (a: Align) =>
    onUpdate({ ...field, settings: { ...field.settings, align: a } });

  // Image is a display-only component: uploader + alignment, no input props
  if (field.type === "image") {
    return (
      <div className="space-y-5">
        <ImageUploader field={field} onUpdate={onUpdate} />
        <div>
          <FieldLabel>Alignment</FieldLabel>
          <AlignmentControl value={field.settings?.align ?? "center"} onChange={setAlign} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ ...field, label: e.target.value })}
          placeholder="Enter your question"
          className="mt-1"
        />
      </div>

      <div>
        <FieldLabel>Subtitle</FieldLabel>
        <RichTextToolbar
          value={field.settings?.subtitle ?? ""}
          onChange={(v) => onUpdate({ ...field, settings: { ...field.settings, subtitle: v } })}
        />
      </div>

      {(field.type === "title" || field.type === "text") && (
        <div>
          <FieldLabel>Alignment</FieldLabel>
          <AlignmentControl value={align} onChange={setAlign} />
        </div>
      )}

      {field.type !== "title" && (
        <div>
          <FieldLabel>Placeholder</FieldLabel>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Add placeholder text"
            className="mt-1"
          />
        </div>
      )}

      {field.type !== "title" && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
            className="h-4 w-4 accent-whatsapp cursor-pointer"
          />
          <label htmlFor={`required-${field.id}`} className="text-sm font-medium text-brand-text cursor-pointer">
            Required field
          </label>
        </div>
      )}
    </div>
  );
}
