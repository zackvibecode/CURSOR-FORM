import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 842;
const LOGO_HEIGHT = 179;

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 text-fg", className)}
    >
      <path
        d="M32 4C18.745 4 8 14.745 8 28C8 36.5 12.2 44 18.8 48.5L14 60L26.5 54.5C28.2 55.1 30.1 55.5 32 55.5C45.255 55.5 56 44.755 56 31.5C56 18.245 45.255 4 32 4Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M20 22H44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 30H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 38H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M34 42L38 46L48 32"
        stroke="#10D050"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  iconOnly = false,
  size = "md",
  priority = false,
  variant = "image",
}: {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  variant?: "image" | "text";
}) {
  const imageHeights = {
    sm: "h-6",
    md: "h-7",
    lg: "h-8",
  };

  const textSizes = {
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
      aria-label="OneForm home"
      className={cn(
        "group inline-flex min-w-0 items-center overflow-hidden",
        variant === "text" && "gap-2",
        className
      )}
    >
      {iconOnly ? (
        <LogoMark className={iconHeights[size]} />
      ) : variant === "text" ? (
        <>
          <LogoMark className={iconHeights[size]} />
          <span
            className={cn(
              "truncate whitespace-nowrap font-bold leading-none tracking-tight text-fg",
              textSizes[size]
            )}
          >
            One<span className="text-whatsapp">Form</span>
          </span>
        </>
      ) : (
        <Image
          src="/oneform-logo.png"
          alt="One Form"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className={cn("max-w-full object-contain", imageHeights[size])}
          priority={priority}
        />
      )}
    </Link>
  );
}
