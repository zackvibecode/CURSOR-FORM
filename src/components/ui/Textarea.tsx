import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted-fg focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20 min-h-[120px] resize-y disabled:opacity-50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
