import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-brand-text outline-none transition-all placeholder:text-brand-muted focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20 min-h-[120px] resize-y",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
