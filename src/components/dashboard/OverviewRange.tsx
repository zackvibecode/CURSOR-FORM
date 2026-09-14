"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { OVERVIEW_RANGES, type OverviewRange } from "@/lib/overview-stats";

const LABELS: Record<number, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
};

export function OverviewRangeSelect({ value }: { value: OverviewRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const select = (range: number) => {
    setOpen(false);
    router.push(`${pathname}?range=${range}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="h-3.5 w-3.5 text-muted-fg" />
        {LABELS[value]}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-fg transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
        >
          {OVERVIEW_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              role="option"
              aria-selected={range === value}
              onClick={() => select(range)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-fg transition-colors hover:bg-muted"
            >
              {LABELS[range]}
              {range === value && <Check className="h-3.5 w-3.5 text-whatsapp" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
