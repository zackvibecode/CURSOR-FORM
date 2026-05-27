import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
