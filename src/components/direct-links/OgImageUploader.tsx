"use client";

/**
 * OG Image Uploader
 * - Upload image directly (drag & drop / click) → stored in form-images bucket
 * - OR paste an image URL
 * - Real-time preview
 * - Remove button
 */

import { useState, useRef, useCallback } from "react";
import { Upload, Link, X, ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface OgImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  directLinkId: string;
}

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const ALLOWED_EXT   = ["png", "jpg", "jpeg", "webp", "gif"];

type Mode = "upload" | "url";

export function OgImageUploader({ value, onChange, directLinkId }: OgImageUploaderProps) {
  const [mode, setMode]           = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput]   = useState(value);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [dragging, setDragging]   = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  // ── Upload ───────────────────────────────────────────────────────────────
  const doUpload = useCallback(async (file: File) => {
    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format. Use PNG, JPG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image exceeds the ${MAX_SIZE_MB} MB size limit.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in again.");
        setUploading(false);
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      if (!ALLOWED_EXT.includes(ext)) {
        setError("File extension not supported.");
        setUploading(false);
        return;
      }

      const path = `${user.id}/og-${directLinkId}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("form-images")
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        setError(uploadErr.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("form-images").getPublicUrl(path);
      onChange(data.publicUrl);
      setUrlInput(data.publicUrl);
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [directLinkId, onChange]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void doUpload(file);
  }, [doUpload]);

  // ── URL apply ────────────────────────────────────────────────────────────
  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { setError("URL cannot be empty."); return; }
    if (!/^https?:\/\//.test(trimmed)) { setError("URL must start with https://"); return; }
    setError("");
    onChange(trimmed);
    setSuccess("Image URL saved!");
    setTimeout(() => setSuccess(""), 2500);
  };

  // ── Remove ───────────────────────────────────────────────────────────────
  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-3">

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="OG Image Preview"
            className="h-44 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/60 px-3 py-2 backdrop-blur-sm">
            <span className="text-[11px] font-medium text-white/80">
              OG Image Preview (1200×630)
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-md bg-red-500/80 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-red-500"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>
          <div className="border-t border-border px-3 py-1.5">
            <p className="truncate font-mono text-[11px] text-muted-fg">{value}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center">
          <ImageIcon className="mb-2 h-8 w-8 text-muted-fg/30" />
          <p className="text-xs text-muted-fg">No image set</p>
          <p className="text-[11px] text-muted-fg/60">Recommended size: 1200 × 630 px</p>
        </div>
      )}

      {/* ── Mode tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => { setMode("upload"); setError(""); }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors",
            mode === "upload" ? "bg-card text-fg shadow-sm" : "text-muted-fg hover:text-fg"
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => { setMode("url"); setError(""); }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-colors",
            mode === "url" ? "bg-card text-fg shadow-sm" : "text-muted-fg hover:text-fg"
          )}
        >
          <Link className="h-3.5 w-3.5" />
          Paste URL
        </button>
      </div>

      {/* ── Upload zone ─────────────────────────────────────────────────── */}
      {mode === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed transition-colors",
            dragging
              ? "border-[#25D366] bg-[#25D366]/5"
              : "border-border bg-muted/30 hover:border-fg/30 hover:bg-muted/50"
          )}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin text-[#25D366]" />
                <p className="text-sm font-medium text-fg">Uploading…</p>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-fg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">
                    Drag & drop or{" "}
                    <span className="text-[#128C7E] underline underline-offset-2 dark:text-[#25D366]">
                      choose a file
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-fg">
                    PNG, JPG, WebP, GIF · Max {MAX_SIZE_MB} MB
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void doUpload(file);
              e.target.value = ""; // reset so same file can be re-uploaded
            }}
          />
        </div>
      )}

      {/* ── URL input ───────────────────────────────────────────────────── */}
      {mode === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } }}
              placeholder="https://example.com/og-image.jpg"
              className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-fg outline-none transition focus:border-fg/40 focus:ring-1 focus:ring-fg/10 placeholder:text-muted-fg"
            />
            <button
              type="button"
              onClick={applyUrl}
              className="shrink-0 rounded-md bg-fg px-3 py-2 text-xs font-semibold text-bg transition hover:bg-gray-600 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
          <p className="text-[11px] text-muted-fg">
            Paste the full image URL. Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{" "}
            or click Apply.
          </p>
        </div>
      )}

      {/* ── Error / success ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-[#25D366]/20 bg-[#25D366]/5 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
          <p className="text-xs text-[#128C7E] dark:text-[#25D366]">{success}</p>
        </div>
      )}
    </div>
  );
}
