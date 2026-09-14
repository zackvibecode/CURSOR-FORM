import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export interface OverviewTopItem {
  id: string;
  label: string;
  count: number;
  percent: number;
  href?: string;
}

interface OverviewTopListProps {
  title: string;
  icon: LucideIcon;
  viewAllHref: string;
  items: OverviewTopItem[];
  emptyLabel: string;
}

export function OverviewTopList({
  title,
  icon: Icon,
  viewAllHref,
  items,
  emptyLabel,
}: OverviewTopListProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-fg" strokeWidth={2} />
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
        >
          View all →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-fg">{emptyLabel}</p>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const row = (
              <>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-fg">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-fg">
                      {item.count.toLocaleString("en-US")}
                    </span>
                    <span className="w-9 text-right font-mono text-[11px] tabular-nums text-muted-fg">
                      {item.percent}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-whatsapp transition-all"
                    style={{ width: `${Math.max(item.percent, item.count > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-md transition-colors hover:bg-muted/40"
              >
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
