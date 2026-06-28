import { cn } from "@/lib/utils";

type BadgeVariant = "new" | "contacted" | "converted" | "pending" | "default";

const dotColor: Record<BadgeVariant, string> = {
  new: "bg-whatsapp",
  contacted: "bg-blue-500",
  converted: "bg-emerald-500",
  pending: "bg-amber-500",
  default: "bg-gray-400",
};

const labelColor: Record<BadgeVariant, string> = {
  new: "text-whatsapp-deep dark:text-whatsapp",
  contacted: "text-blue-600 dark:text-blue-400",
  converted: "text-emerald-600 dark:text-emerald-400",
  pending: "text-amber-600 dark:text-amber-400",
  default: "text-muted-fg",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium capitalize",
        labelColor[variant],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[variant])} />
      {children}
    </span>
  );
}
