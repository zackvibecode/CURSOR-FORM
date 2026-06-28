import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted-fg focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
