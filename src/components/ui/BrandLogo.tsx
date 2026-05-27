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
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-whatsapp text-sm font-bold text-white shadow-soft">
        Z
      </span>
      <div className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-brand-text">
          ZAQONE<span className="text-whatsapp">.FORM</span>
        </span>
        {showDomain && (
          <span className="text-[11px] font-medium text-brand-muted">Zaq1.com</span>
        )}
      </div>
    </Link>
  );
}
