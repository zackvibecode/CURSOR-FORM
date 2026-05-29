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
    md: "h-9",
    lg: "h-11",
  };

  return (
    <Link href="/" className={cn("group inline-flex items-center", className)}>
      {iconOnly ? (
        <Image
          src="/favicon.png"
          alt="OneForm"
          width={1024}
          height={769}
          className={cn("aspect-square w-auto object-contain mix-blend-screen", heights[size])}
          priority
        />
      ) : (
        <Image
          src="/oneform-logo.png"
          alt="OneForm"
          width={1024}
          height={769}
          className={cn(
            "w-auto max-w-[180px] mix-blend-screen sm:max-w-[220px]",
            heights[size]
          )}
          priority
        />
      )}
    </Link>
  );
}
