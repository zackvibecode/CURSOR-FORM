import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    sm: "h-7",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <Link href="/" className={cn("group inline-flex items-center", className)}>
      {iconOnly ? (
        <Image
          src="/favicon.png"
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
    </Link>
  );
}
