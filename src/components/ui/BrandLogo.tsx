"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 842;
const LOGO_HEIGHT = 179;

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <Image
        src="/oneform-logo.png"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="absolute left-0 top-0 h-full w-auto max-w-none"
        draggable={false}
        sizes="32px"
      />
    </span>
  );
}

function LogoImage({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn("relative", className)}
      style={{ aspectRatio: `${LOGO_WIDTH} / ${LOGO_HEIGHT}` }}
    >
      <Image
        src="/oneform-logo.png"
        alt="OneForm"
        fill
        className="object-contain object-left"
        priority={priority}
        sizes="200px"
      />
    </div>
  );
}

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
  /** @deprecated Use default full logo image instead */
  variant?: "image" | "text";
}) {
  const imageSizes = {
    sm: "h-6 w-auto",
    md: "h-7 w-auto",
    lg: "h-8 w-auto",
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
      className={cn("group inline-flex min-w-0 shrink-0 items-center", className)}
    >
      {iconOnly ? (
        <LogoMark className={iconHeights[size]} />
      ) : (
        <LogoImage className={imageSizes[size]} priority={priority} />
      )}
    </Link>
  );
}
