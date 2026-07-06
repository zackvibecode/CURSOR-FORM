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
  Youtube,
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
  { type: "youtube", label: "YouTube Video", icon: Youtube },
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
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2.5 text-left text-xs font-medium text-fg transition-colors hover:border-fg/30 hover:bg-muted active:scale-[0.98]"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-fg" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full shrink-0 overflow-x-auto border-b border-border bg-card p-3 lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4 scrollbar-thin">
      <h3 className="mb-3 hidden text-[10px] font-semibold uppercase tracking-wider text-muted-fg lg:block">
        Field types
      </h3>
      <div className="flex gap-2 lg:flex-col lg:space-y-1.5 lg:gap-0">
        {BUILDER_FIELDS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddField(type)}
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-xs font-medium text-fg transition-colors hover:border-fg/30 hover:bg-muted lg:w-full"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-fg" strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
