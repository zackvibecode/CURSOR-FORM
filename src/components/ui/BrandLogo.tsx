import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showDomain = false,
}: {
  className?: string;
  showDomain?: boolean;
}) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 280 72"
        className="h-8 w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Speech bubble icon */}
        <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12C20 6.477 24.477 2 30 2H44C49.523 2 54 6.477 54 12V28C54 33.523 49.523 38 44 38H34L24 48L24 38H20C14.477 38 10 33.523 10 28V12Z" fill="none" />
          <path d="M18 16H36" strokeWidth="3" />
          <path d="M18 22H32" strokeWidth="3" />
          <path d="M18 28H28" strokeWidth="3" />
          <path d="M36 32L42 38" strokeWidth="3" stroke="#25D366" />
        </g>
        {/* Text: OneForm */}
        <text x="64" y="44" fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif" fontSize="38" fontWeight="700" fill="currentColor">
          <tspan fill="#111827">One</tspan>
          <tspan fill="#25D366">Form</tspan>
        </text>
      </svg>
      {showDomain && (
        <span className="hidden text-[11px] font-medium text-brand-muted sm:block">oneform.app</span>
      )}
    </Link>
  );
}
