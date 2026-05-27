"use client";

import type { FormField } from "@/lib/form-schema";
import { PublicFormView } from "@/components/form/PublicFormView";
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
}: PreviewModalProps) {
  const [view, setView] = useState<"mobile" | "desktop">("mobile");

  return (
    <Modal open={open} onClose={onClose} title="Form Preview" size="xl">
      <div className="mb-4 flex justify-center gap-2">
        <button
          onClick={() => setView("mobile")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            view === "mobile" ? "bg-whatsapp text-white" : "bg-gray-100"
          )}
        >
          <Smartphone className="h-4 w-4" />
          Mobile
        </button>
        <button
          onClick={() => setView("desktop")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            view === "desktop" ? "bg-whatsapp text-white" : "bg-gray-100"
          )}
        >
          <Monitor className="h-4 w-4" />
          Desktop
        </button>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "rounded-2xl border border-gray-200 bg-white p-6 shadow-card transition-all",
            view === "mobile" ? "w-full max-w-sm" : "w-full max-w-2xl"
          )}
        >
          <PublicFormView
            title={title}
            description={description}
            ctaText={ctaText}
            whatsappNumber={whatsappNumber}
            fields={fields}
            formId={formId}
            preview
          />
        </div>
      </div>
    </Modal>
  );
}
