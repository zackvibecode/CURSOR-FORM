"use client";

import type { FormField } from "@/lib/form-schema";
import { DynamicFieldRenderer } from "@/components/form/DynamicFieldRenderer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormCanvasProps {
  fields: FormField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fields: FormField[]) => void;
  onDelete: (id: string) => void;
  formTitle: string;
  formDescription: string;
}

function SortableField({
  field,
  selected,
  onSelect,
  onDelete,
}: {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border-2 bg-white p-4 transition-all",
        selected ? "border-whatsapp shadow-md" : "border-gray-100 hover:border-gray-200",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onSelect}
    >
      <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          {...attributes}
          {...listeners}
          className="rounded-lg bg-white p-1 shadow-md hover:bg-gray-50"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <button
        className="absolute -right-2 -top-2 rounded-full bg-brand-red p-1.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete field"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <DynamicFieldRenderer
        fields={[field]}
        values={{}}
        onChange={() => {}}
        preview
      />
    </div>
  );
}

export function FormCanvas({
  fields,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  formTitle,
  formDescription,
}: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(fields, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-brand-bg/50 p-6">
      <div className="mb-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Live Preview
        </span>
      </div>
      <div className="mx-auto max-w-xl rounded-3xl border border-brand-border bg-white p-6 shadow-card-lg sm:p-8">
        {/* Form Title & Description — only shown when a title is set */}
        {formTitle.trim() && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{formTitle}</h2>
            {formDescription && (
              <p className="mt-1 text-sm text-gray-500">{formDescription}</p>
            )}
          </div>
        )}

        {fields.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-brand-border bg-brand-bg/30 p-12 text-center">
            <p className="text-brand-muted">
              Add fields from the left panel to build your form
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {fields.map((field) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    selected={selectedId === field.id}
                    onSelect={() => onSelect(field.id)}
                    onDelete={() => onDelete(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
