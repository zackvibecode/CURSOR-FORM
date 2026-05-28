import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-text outline-none transition-all duration-150 placeholder:text-brand-muted focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
