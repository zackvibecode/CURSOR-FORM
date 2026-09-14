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
    <div className="rounded-lg border border-border bg-card p-5 transition-colors">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-whatsapp-light text-whatsapp-deep dark:bg-whatsapp/10 dark:text-whatsapp">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <span className="text-xs font-medium text-muted-fg">{label}</span>
      </div>

      <p className="font-mono text-2xl font-semibold tracking-tight text-fg tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>

      <div className="mt-1.5 flex items-center gap-1 text-[11px]">
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
            <span className="text-muted-fg">vs previous period</span>
          </>
        )}
      </div>
    </div>
  );
}
