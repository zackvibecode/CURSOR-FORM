import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ICON_SIZE = 367;

export function BrandLogo({
  className,
  iconOnly = false,
  size = "md",
  priority = false,
}: {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const heights = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const iconHeights = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  };

  return (
    <Link
      href="/"
      className={cn("group inline-flex shrink-0 items-center gap-2 overflow-hidden", className)}
    >
      <Image
        src="/favicon-icon.png"
        alt="One Form"
        width={ICON_SIZE}
        height={ICON_SIZE}
        className={cn("object-contain", iconHeights[size])}
        priority={priority}
      />
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-fg", heights[size])}>
          One<span className="text-whatsapp">Form</span>
        </span>
      )}
    </Link>
  );
}
