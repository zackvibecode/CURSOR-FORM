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
        "group relative rounded-md border bg-card p-4 transition-colors",
        selected
          ? "border-whatsapp ring-1 ring-whatsapp/40"
          : "border-border hover:border-fg/30",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      <div className="absolute -left-3 top-1/2 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md border border-border bg-card p-1 text-muted-fg shadow-sm hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1 text-muted-fg opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete field"
      >
        <Trash2 className="h-3 w-3" />
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
    <div className="flex-1 overflow-auto bg-muted/30 p-6 scrollbar-thin">
      <div className="mb-3 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
          Live preview
        </span>
      </div>
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 sm:p-8">
        {formTitle.trim() && (
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="text-base font-semibold text-fg">{formTitle}</h2>
            {formDescription && (
              <p className="mt-1 text-sm text-muted-fg">{formDescription}</p>
            )}
          </div>
        )}

        {fields.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-sm text-muted-fg">
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
              <div className="space-y-3">
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
