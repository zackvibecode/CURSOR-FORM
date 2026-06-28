import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp";
  size?: "sm" | "md" | "lg";
  showWhatsAppIcon?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      showWhatsAppIcon = false,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
          {
            // Vercel primary: black on light, white on dark
            "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200":
              variant === "primary",
            // WhatsApp brand green for WhatsApp-specific CTAs only
            "bg-whatsapp text-white hover:bg-whatsapp-deep":
              variant === "whatsapp",
            "border border-border bg-transparent text-fg hover:bg-muted":
              variant === "secondary",
            "border border-border bg-card text-fg hover:border-fg/40 hover:bg-muted":
              variant === "outline",
            "text-muted-fg hover:bg-muted hover:text-fg": variant === "ghost",
            "border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400":
              variant === "danger",
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-5 py-2.5 text-sm": size === "lg",
          },
          className
        )}
        {...props}
      >
        {(variant === "whatsapp" || showWhatsAppIcon) && (
          <WhatsAppIcon className="h-4 w-4" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
