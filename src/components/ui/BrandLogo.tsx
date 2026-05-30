import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 842;
const LOGO_HEIGHT = 179;
const ICON_SIZE = 367;

export function BrandLogo({
  className,
  iconOnly = false,
  size = "md",
}: {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const heights = {
    sm: "h-6",
    md: "h-7",
    lg: "h-8",
  };

  const iconHeights = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  };

  return (
    <Link
      href="/"
      className={cn("group inline-flex shrink-0 items-center overflow-hidden", className)}
    >
      {iconOnly ? (
        <Image
          src="/favicon-icon.png"
          alt="One Form"
          width={ICON_SIZE}
          height={ICON_SIZE}
          className={cn("object-contain", iconHeights[size])}
          priority
        />
      ) : (
        <Image
          src="/oneform-logo.png"
          alt="One Form"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className={cn("w-auto object-contain", heights[size])}
          priority
        />
      )}
    </Link>
  );
}
