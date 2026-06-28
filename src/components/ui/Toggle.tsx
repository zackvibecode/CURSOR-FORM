import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      {label && <span className="text-sm text-fg">{label}</span>}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40",
          checked
            ? "border-whatsapp bg-whatsapp"
            : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </button>
    </label>
  );
}
