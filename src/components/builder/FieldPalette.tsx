"use client";

import { FIELD_TYPES, type FieldType } from "@/lib/form-schema";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  ChevronDown,
  Calendar,
  Hash,
  CheckSquare,
  ListChecks,
  Heading,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

const BUILDER_FIELDS: { type: FieldType; label: string; icon: LucideIcon }[] = [
  { type: "text", label: "Text Input", icon: Type },
  { type: "phone", label: "Phone Input", icon: Phone },
  { type: "email", label: "Email Input", icon: Mail },
  { type: "number", label: "Number Input", icon: Hash },
  { type: "dropdown", label: "Dropdown", icon: ChevronDown },
  { type: "multiple_choice", label: "Multiple Choice", icon: ListChecks },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "textarea", label: "Textarea", icon: AlignLeft },
  { type: "date", label: "Date Picker", icon: Calendar },
  { type: "title", label: "Title / Heading", icon: Heading },
  { type: "image", label: "Image", icon: ImageIcon },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <aside className="w-56 shrink-0 overflow-auto border-r border-brand-border bg-white p-4">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-muted">
        Field Components
      </h3>
      <div className="space-y-2">
        {BUILDER_FIELDS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className="flex w-full items-center gap-3 rounded-xl border border-brand-border bg-brand-bg/30 px-3 py-2.5 text-left text-sm font-medium transition-all hover:border-whatsapp hover:bg-white hover:shadow-card"
          >
            <Icon className="h-4 w-4 text-whatsapp" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
