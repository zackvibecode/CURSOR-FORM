import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewKpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  change?: number | null;
}

export function OverviewKpiCard({ label, value, icon: Icon, change }: OverviewKpiCardProps) {
  const up = typeof change === "number" && change > 0;
  const down = typeof change === "number" && change < 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors sm:p-5">
      <div className="mb-2.5 flex items-center gap-2 sm:mb-3 sm:gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-whatsapp-light text-whatsapp-deep dark:bg-whatsapp/10 dark:text-whatsapp sm:h-8 sm:w-8">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
        </div>
        <span className="min-w-0 truncate text-[11px] font-medium text-muted-fg sm:text-xs">
          {label}
        </span>
      </div>

      <p className="font-mono text-xl font-semibold tracking-tight text-fg tabular-nums sm:text-2xl">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] sm:mt-1.5 sm:text-[11px]">
        {change == null ? (
          <>
            <Minus className="h-3 w-3 text-muted-fg" />
            <span className="font-medium text-muted-fg">—</span>
          </>
        ) : (
          <>
            {up ? (
              <ArrowUp className="h-3 w-3 text-whatsapp-deep dark:text-whatsapp" />
            ) : down ? (
              <ArrowDown className="h-3 w-3 text-red-500" />
            ) : (
              <Minus className="h-3 w-3 text-muted-fg" />
            )}
            <span
              className={cn(
                "font-medium",
                up && "text-whatsapp-deep dark:text-whatsapp",
                down && "text-red-500",
                !up && !down && "text-muted-fg"
              )}
            >
              {change === 0 ? "0%" : `${up ? "+" : ""}${change}%`}
            </span>
            <span className="hidden text-muted-fg sm:inline">vs previous</span>
          </>
        )}
      </div>
    </div>
  );
}
