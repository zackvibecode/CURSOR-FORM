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
        "rounded-lg border border-border bg-card p-5 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
