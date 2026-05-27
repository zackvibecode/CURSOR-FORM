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
        "rounded-2xl border border-brand-border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-lg",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-muted">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-brand-text">{value}</p>
      {change && <p className="mt-1 text-xs text-brand-muted">{change}</p>}
    </div>
  );
}
