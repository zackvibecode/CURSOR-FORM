"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OVERVIEW_RANGES, type OverviewRange } from "@/lib/overview-stats";

const LABELS: Record<number, string> = {
  7: "7d",
  30: "30d",
  90: "90d",
};

const LABELS_FULL: Record<number, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
};

export function OverviewRangeSelect({ value }: { value: OverviewRange }) {
  const router = useRouter();
  const pathname = usePathname();

  const select = (range: number) => {
    router.push(`${pathname}?range=${range}`);
  };

  return (
    <div
      role="listbox"
      aria-label="Date range"
      className="flex w-full rounded-lg border border-border bg-muted p-0.5 sm:w-auto"
    >
      {OVERVIEW_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          role="option"
          aria-selected={range === value}
          title={LABELS_FULL[range]}
          onClick={() => select(range)}
          className={cn(
            "min-h-9 flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:min-h-0 sm:px-2.5 sm:py-1",
            range === value
              ? "bg-card text-fg shadow-sm"
              : "text-muted-fg hover:text-fg"
          )}
        >
          <span className="sm:hidden">{LABELS[range]}</span>
          <span className="hidden sm:inline">{LABELS_FULL[range]}</span>
        </button>
      ))}
    </div>
  );
}
