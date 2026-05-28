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
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          {
            "bg-whatsapp text-white shadow-md hover:bg-[#20bd5a] hover:shadow-lg":
              variant === "primary" || variant === "whatsapp",
            "bg-white text-brand-text shadow-sm hover:bg-gray-50":
              variant === "secondary",
            "border border-brand-border bg-white text-brand-text hover:border-whatsapp hover:text-whatsapp-deep":
              variant === "outline",
            "text-brand-muted hover:bg-gray-100 hover:text-brand-text": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-sm": size === "md",
            "px-8 py-3.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {(variant === "whatsapp" || showWhatsAppIcon) && <WhatsAppIcon className="h-5 w-5" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
