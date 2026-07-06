"use client";

import { useState } from "react";
import type { FormField } from "@/lib/form-schema";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { buildYouTubeEmbedUrl, parseYouTubeVideoId } from "@/lib/youtube";
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
  Loader2,
} from "lucide-react";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 normal-case">
      {children}
      <HelpCircle className="h-3 w-3 text-muted-fg/50" />
    </Label>
  );
}

function RichTextToolbar({
  value,
  onChange,
  placeholder = "Add description text here",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-1 rounded-t-md border border-b-0 border-border bg-muted px-2 py-1.5">
        <button type="button" className="rounded p-1 text-muted-fg transition-colors hover:bg-border/50 hover:text-fg" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="rounded p-1 text-muted-fg transition-colors hover:bg-border/50 hover:text-fg" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="rounded p-1 text-muted-fg transition-colors hover:bg-border/50 hover:text-fg" title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-b-md border border-t-0 border-border bg-card px-3 py-2 text-sm text-fg outline-none placeholder:text-muted-fg focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
        rows={2}
      />
    </div>
  );
}

type Align = "left" | "center" | "right";
type ImageSize = "fit" | "medium" | "full";

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
    <div className="mt-1 inline-flex rounded-md border border-border bg-muted p-1">
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={label}
          className={cn(
            "flex h-7 w-8 items-center justify-center rounded transition-colors",
            value === key
              ? "bg-card text-fg shadow-sm"
              : "text-muted-fg hover:text-fg"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function ImageSizeControl({
  value,
  onChange,
}: {
  value: ImageSize;
  onChange: (size: ImageSize) => void;
}) {
  const options: { key: ImageSize; label: string; description: string }[] = [
    { key: "fit", label: "Fit", description: "Keep natural ratio" },
    { key: "medium", label: "Medium", description: "Balanced promo size" },
    { key: "full", label: "Full", description: "Fill form width" },
  ];

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            "rounded-md border px-2 py-2 text-left transition-colors",
            value === option.key
              ? "border-whatsapp bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp"
              : "border-border bg-muted/40 text-muted-fg hover:border-fg/30 hover:text-fg"
          )}
        >
          <span className="block text-[11px] font-semibold">{option.label}</span>
          <span className="mt-0.5 block text-[9px] leading-tight opacity-70">
            {option.description}
          </span>
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to upload images.");
        setUploading(false);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const allowedExt = ["png", "jpg", "jpeg", "gif", "webp"];
      if (!allowedExt.includes(ext)) {
        setError("Only PNG, JPG, GIF, or WebP images are allowed.");
        setUploading(false);
        return;
      }
      const path = `${user.id}/${field.id}-${Date.now()}.${ext}`;
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
            className="max-h-40 w-full rounded-md border border-border object-contain"
          />
          <button
            type="button"
            onClick={() =>
              onUpdate({ ...field, settings: { ...field.settings, imageUrl: "" } })
            }
            className="flex items-center gap-1.5 text-xs text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove image
          </button>
        </div>
      ) : (
        <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:border-whatsapp hover:bg-whatsapp/5">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-whatsapp" />
          ) : (
            <Upload className="h-5 w-5 text-muted-fg" />
          )}
          <span className="text-xs font-medium text-muted-fg">
            {uploading ? "Uploading…" : "Click to upload an image"}
          </span>
          <span className="text-[11px] text-muted-fg">PNG, JPG up to 5MB</span>
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
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
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
              <button type="button" className="cursor-grab text-muted-fg/40 opacity-0 transition-opacity group-hover:opacity-100" title="Drag to reorder">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1">
                <Input value={option} onChange={(e) => updateOption(index, e.target.value)} className="text-sm" placeholder={`Option ${index + 1}`} />
              </div>
              <span className="w-3 text-center font-mono text-[10px] text-muted-fg/50">{index}</span>
              <button type="button" onClick={() => removeOption(index)} className="p-1 text-muted-fg/40 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100" title="Remove option">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs font-medium text-muted-fg transition-colors hover:text-fg">
            <Plus className="h-3.5 w-3.5" />
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
  const imageSize: ImageSize = field.settings?.imageSize ?? "medium";
  const setAlign = (a: Align) =>
    onUpdate({ ...field, settings: { ...field.settings, align: a } });
  const setImageSize = (size: ImageSize) =>
    onUpdate({ ...field, settings: { ...field.settings, imageSize: size } });

  if (field.type === "image") {
    return (
      <div className="space-y-5">
        <ImageUploader field={field} onUpdate={onUpdate} />
        <div>
          <FieldLabel>Image size</FieldLabel>
          <ImageSizeControl value={imageSize} onChange={setImageSize} />
        </div>
        <div>
          <FieldLabel>Alignment</FieldLabel>
          <AlignmentControl value={field.settings?.align ?? "center"} onChange={setAlign} />
        </div>
      </div>
    );
  }

  if (field.type === "youtube") {
    const videoId = parseYouTubeVideoId(field.settings?.videoUrl);
    const autoplay = field.settings?.autoplay !== false;

    return (
      <div className="space-y-5">
        <div>
          <FieldLabel>YouTube link</FieldLabel>
          <Input
            value={field.settings?.videoUrl ?? ""}
            onChange={(e) =>
              onUpdate({
                ...field,
                settings: { ...field.settings, videoUrl: e.target.value },
              })
            }
            placeholder="https://www.youtube.com/watch?v=..."
            className="mt-1"
          />
          {field.settings?.videoUrl && !videoId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Enter a valid YouTube URL or video ID
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) =>
              onUpdate({
                ...field,
                settings: { ...field.settings, autoplay: e.target.checked },
              })
            }
            className="h-3.5 w-3.5 cursor-pointer accent-whatsapp"
          />
          <span className="text-sm text-fg">Autoplay when form opens (muted)</span>
        </label>

        {videoId && (
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={buildYouTubeEmbedUrl(videoId, { autoplay: false })}
              title="YouTube preview"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video w-full"
            />
          </div>
        )}

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

      {field.type === "title" && (
        <div>
          <FieldLabel>Text style</FieldLabel>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  ...field,
                  settings: { ...field.settings, bold: !field.settings?.bold },
                })
              }
              title="Bold"
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md border transition-colors",
                field.settings?.bold
                  ? "border-whatsapp bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp"
                  : "border-border bg-muted text-muted-fg hover:text-fg"
              )}
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <div className="inline-flex rounded-md border border-border bg-muted p-1">
              {(["normal", "headline"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ ...field, settings: { ...field.settings, size: s } })}
                  className={cn(
                    "rounded px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors",
                    (field.settings?.size ?? "normal") === s
                      ? "bg-card text-fg shadow-sm"
                      : "text-muted-fg hover:text-fg"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
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
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.required}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
            className="h-3.5 w-3.5 accent-whatsapp cursor-pointer"
          />
          <span className="text-sm text-fg">
            Required field
          </span>
        </label>
      )}
    </div>
  );
}
