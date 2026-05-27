import { cn } from "@/lib/utils";

type BadgeVariant = "new" | "contacted" | "converted" | "pending" | "default";

const variants: Record<BadgeVariant, string> = {
  new: "bg-whatsapp/10 text-whatsapp-deep",
  contacted: "bg-blue-50 text-blue-700",
  converted: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  default: "bg-gray-100 text-brand-muted",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
