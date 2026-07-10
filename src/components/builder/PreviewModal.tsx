"use client";

import type { FormField } from "@/lib/form-schema";
import type { FormMode } from "@/lib/form-settings";
import { PublicFormView } from "@/components/form/PublicFormView";
import { DirectWhatsAppView } from "@/components/form/DirectWhatsAppView";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  ctaText: string;
  whatsappNumber: string;
  fields: FormField[];
  formId: string;
  formMode?: FormMode;
  directMessage?: string;
}

export function PreviewModal({
  open,
  onClose,
  title,
  description,
  ctaText,
  whatsappNumber,
  fields,
  formId,
  formMode = "form",
  directMessage = "",
}: PreviewModalProps) {
  const isDirect = formMode === "direct";
  const [view, setView] = useState<"mobile" | "desktop">("mobile");

  return (
    <Modal open={open} onClose={onClose} title="Preview" size="xl">
      <div className="mb-4 flex justify-center gap-1.5">
        <button
          onClick={() => setView("mobile")}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            view === "mobile"
              ? "border-fg/30 bg-muted text-fg"
              : "border-border text-muted-fg hover:bg-muted hover:text-fg"
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          Mobile
        </button>
        <button
          onClick={() => setView("desktop")}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            view === "desktop"
              ? "border-fg/30 bg-muted text-fg"
              : "border-border text-muted-fg hover:bg-muted hover:text-fg"
          )}
        >
          <Monitor className="h-3.5 w-3.5" />
          Desktop
        </button>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "rounded-lg border border-border bg-card p-6 transition-all",
            view === "mobile" ? "w-full max-w-sm" : "w-full max-w-2xl"
          )}
        >
          {isDirect ? (
            <DirectWhatsAppView
              title={title}
              description={description}
              ctaText={ctaText}
              whatsappNumber={whatsappNumber}
              directMessage={directMessage}
              preview
            />
          ) : (
            <PublicFormView
              title={title}
              description={description}
              ctaText={ctaText}
              whatsappNumber={whatsappNumber}
              fields={fields}
              formId={formId}
              preview
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
