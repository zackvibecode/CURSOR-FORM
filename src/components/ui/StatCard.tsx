import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 transition-colors",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
          {title}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-fg">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
      <p className="font-mono text-2xl font-semibold tracking-tight text-fg tabular-nums">
        {value}
      </p>
      {change && <p className="mt-1 text-xs text-muted-fg">{change}</p>}
    </div>
  );
}
