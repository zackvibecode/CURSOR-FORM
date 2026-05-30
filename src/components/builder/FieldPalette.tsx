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
  vertical?: boolean;
}

export function FieldPalette({ onAddField, vertical = false }: FieldPaletteProps) {
  if (vertical) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {BUILDER_FIELDS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onAddField(type)}
              className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg/30 px-3 py-3 text-left text-sm font-medium transition-all hover:border-whatsapp hover:bg-white active:scale-[0.98]"
            >
              <Icon className="h-4 w-4 shrink-0 text-whatsapp" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full shrink-0 overflow-x-auto border-b border-brand-border bg-white p-3 lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
      <h3 className="mb-3 hidden text-xs font-bold uppercase tracking-wider text-brand-muted lg:mb-4 lg:block">
        Field Components
      </h3>
      <div className="flex gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
        {BUILDER_FIELDS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-brand-border bg-brand-bg/30 px-3 py-2.5 text-left text-sm font-medium transition-all hover:border-whatsapp hover:bg-white hover:shadow-card lg:w-full lg:gap-3"
          >
            <Icon className="h-4 w-4 text-whatsapp" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
