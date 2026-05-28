import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showDomain = false,
  iconOnly = false,
  size = "md",
}: {
  className?: string;
  showDomain?: boolean;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const heights = {
    sm: "h-7",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <Link href="/" className={cn("group inline-flex flex-col items-start gap-0.5", className)}>
      <span className="inline-flex items-center">
        {iconOnly ? (
          <Image
            src="/oneform-icon.svg"
            alt="OneForm"
            width={36}
            height={36}
            className={cn("w-auto", heights[size])}
            priority
          />
        ) : (
          <Image
            src="/oneform-logo.png"
            alt="OneForm"
            width={220}
            height={56}
            className={cn("w-auto", heights[size])}
            priority
          />
        )}
      </span>
      {showDomain && (
        <span className="pl-0.5 text-[11px] font-medium text-brand-muted">oneform.app</span>
      )}
    </Link>
  );
}
