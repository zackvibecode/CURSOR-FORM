"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAM_RANGES, type TeamRange } from "@/lib/team-analytics";

const LABELS: Record<TeamRange, string> = {
  this_month: "This month",
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  all: "All time",
};

export function TeamRangeSelect({ value, label }: { value: TeamRange; label: string }) {
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

  const select = (range: TeamRange) => {
    setOpen(false);
    router.push(`${pathname}?range=${range}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-muted-fg" />
        {label}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-fg transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
        >
          {TEAM_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              role="option"
              aria-selected={range === value}
              onClick={() => select(range)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-muted"
            >
              {LABELS[range]}
              {range === value && <Check className="h-4 w-4 text-whatsapp" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
