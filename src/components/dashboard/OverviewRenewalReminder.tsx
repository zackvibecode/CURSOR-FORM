import Link from "next/link";
import { AlertTriangle, CalendarClock, Timer, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewRenewalReminderProps {
  plan: string;
  expiresAt: string | null;
}

export function OverviewRenewalReminder({ plan, expiresAt }: OverviewRenewalReminderProps) {
  if (plan === "free" || !expiresAt) return null;

  const daysLeft = Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
  if (daysLeft > 7) return null;

  const expired = daysLeft < 0;
  const urgent = daysLeft <= 3;
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const ReminderIcon: LucideIcon = expired ? AlertTriangle : Timer;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <Link
      href="/pricing"
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-4 transition-colors sm:p-5",
        expired
          ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
          : urgent
            ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
            : "border-border bg-card hover:bg-muted/40"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md sm:h-10 sm:w-10",
          expired
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : urgent
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-fg"
        )}
      >
        <ReminderIcon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            expired ? "text-red-800 dark:text-red-200" : "text-fg"
          )}
        >
          {expired
            ? `Pelan ${planLabel} telah tamat`
            : daysLeft === 0
              ? `Pelan ${planLabel} tamat hari ini`
              : `${daysLeft} hari lagi sebelum tamat`}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-fg">
          {expired ? `Tamat pada ${expiryDate} — renewal sekarang` : `Tamat pada ${expiryDate}`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors",
          expired
            ? "bg-red-600 group-hover:bg-red-700"
            : "bg-fg group-hover:bg-gray-600 dark:group-hover:bg-gray-200 dark:group-hover:text-bg"
        )}
      >
        Top Up
      </span>
    </Link>
  );
}
