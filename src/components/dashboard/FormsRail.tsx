"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  Copy,
  FileText,
  Inbox,
  Link2,
  MoreHorizontal,
} from "lucide-react";
import { cn, formatDateOnly, formatMonthKey } from "@/lib/utils";
import { getAppUrl } from "@/lib/forms";
import type { MonthPoint } from "@/lib/overview-stats";
import { toast } from "@/components/ui/Toast";

export interface RailDirectLink {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  total_clicks: number;
  distribution_mode: "single" | "distribute" | "conditional";
  created_at: string;
}

interface FormsRailProps {
  totalForms: number;
  totalSubmissions: number;
  formsChange: number | null;
  submissionsChange: number | null;
  monthly: MonthPoint[];
  directLinks: RailDirectLink[];
}

const MODE_LABELS: Record<string, string> = {
  single: "Single",
  distribute: "Distribute",
  conditional: "Conditional",
};

function DeltaLabel({ change }: { change: number | null }) {
  if (change == null) {
    return <span className="text-[11px] font-medium text-muted-fg">from last month</span>;
  }
  const up = change >= 0;
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      {up ? (
        <ArrowUp className="h-3 w-3 text-whatsapp-deep dark:text-whatsapp" />
      ) : (
        <ArrowDown className="h-3 w-3 text-red-500" />
      )}
      <span className={cn("font-medium", up ? "text-whatsapp-deep dark:text-whatsapp" : "text-red-500")}>
        {up ? "+" : ""}
        {change}%
      </span>
      <span className="text-muted-fg">from last month</span>
    </span>
  );
}

function MiniMonthlyChart({ data }: { data: MonthPoint[] }) {
  const W = 320;
  const H = 112;
  if (!data.length) {
    return (
      <div className="mt-4 flex h-28 items-center justify-center text-xs text-muted-fg">
        No submission trend yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const last = data[data.length - 1]!;
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const x = (i: number) => i * step;
  const y = (value: number) => H - 6 - (value / max) * (H - 20);
  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`)
    .join(" ");
  const area = `${line} L ${x(data.length - 1)} ${H} L 0 ${H} Z`;

  return (
    <div className="mt-4">
      <div className="relative">
        <span className="absolute right-0 -top-1 z-10 rounded-md bg-fg px-2.5 py-1 text-right text-[10px] leading-tight text-bg shadow-sm">
          <span className="block font-semibold">{last.value} submissions</span>
          <span className="block opacity-80">{formatMonthKey(last.key)}</span>
        </span>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="forms-rail-month-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10D050" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10D050" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#forms-rail-month-grad)" />
          <path
            d={line}
            fill="none"
            stroke="#10D050"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={x(data.length - 1)}
            cy={y(last.value)}
            r="4"
            fill="#10D050"
            stroke="var(--card)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted-fg">
        {data.map((d) => (
          <span key={d.key}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function RailStatTile({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  change: number | null;
}) {
  return (
    <div className="rounded-md border border-border bg-bg p-3">
      <div className="mb-2 flex items-center gap-1.5 text-muted-fg">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="font-mono text-xl font-semibold tabular-nums text-fg">
        {value.toLocaleString("en-US")}
      </p>
      <div className="mt-1">
        <DeltaLabel change={change} />
      </div>
    </div>
  );
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast("Link copied", "success");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-fg transition-colors hover:bg-muted hover:text-fg"
      title="Copy link"
      aria-label="Copy link"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-whatsapp-deep" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function FormsRail({
  totalForms,
  totalSubmissions,
  formsChange,
  submissionsChange,
  monthly,
  directLinks,
}: FormsRailProps) {
  return (
    <>
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-fg" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-fg">Overview</h2>
          </div>
          <Link
            href="/dashboard/overview"
            className="text-xs font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
          >
            View all →
          </Link>
        </div>
        <p className="mb-4 text-xs text-muted-fg">Key metrics from your workspace.</p>

        <div className="grid grid-cols-2 gap-3">
          <RailStatTile
            icon={FileText}
            label="Total Forms"
            value={totalForms}
            change={formsChange}
          />
          <RailStatTile
            icon={Inbox}
            label="Total Submissions"
            value={totalSubmissions}
            change={submissionsChange}
          />
        </div>

        <MiniMonthlyChart data={monthly} />
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-fg" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-fg">Direct Links</h2>
          </div>
          <Link
            href="/dashboard/direct-links"
            className="text-xs font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
          >
            View all →
          </Link>
        </div>
        <p className="mb-4 text-xs text-muted-fg">Send visitors directly to WhatsApp.</p>

        {directLinks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-fg">
            No direct links yet. Create one to send visitors straight to WhatsApp.
          </p>
        ) : (
          <div className="space-y-3">
            {directLinks.map((link) => {
              const url = getAppUrl(`/d/${link.slug}`);
              return (
                <div key={link.id} className="rounded-md border border-border bg-bg p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-semibold uppercase tracking-wide text-fg">
                        {link.name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium capitalize",
                          link.status === "published"
                            ? "text-whatsapp-deep dark:text-whatsapp"
                            : "text-muted-fg"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            link.status === "published" ? "bg-whatsapp" : "bg-gray-400"
                          )}
                        />
                        {link.status}
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/direct-links/${link.id}/edit`}
                      className="shrink-0 rounded p-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                      aria-label="Open direct link"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Link>
                  </div>

                  <p className="mb-2 truncate font-mono text-[11px] text-muted-fg">/d/{link.slug}</p>

                  <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-muted-fg">
                    <span className="inline-flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      <span className="font-mono tabular-nums">
                        {(link.total_clicks ?? 0).toLocaleString("en-US")}
                      </span>
                      clicks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      {MODE_LABELS[link.distribution_mode] ?? link.distribution_mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-fg">
                      {url}
                    </span>
                    <CopyUrlButton url={url} />
                  </div>

                  <p className="mt-2 font-mono text-[10px] text-muted-fg/80">
                    Created {formatDateOnly(link.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
