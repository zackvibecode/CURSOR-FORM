"use client";

/**
 * Direct Link Reports — click totals + per-sales (team member) breakdown.
 */

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Users,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MemberStat {
  member_id: string | null;
  name: string;
  phone: string | null;
  clicks: number;
  percent: number;
}

interface DailyPoint {
  date: string;
  clicks: number;
}

interface RecentClick {
  id: string;
  assigned_name: string | null;
  assigned_phone: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  clicked_at: string;
}

interface AnalyticsPayload {
  summary: {
    total_clicks: number;
    total_redirects: number;
    period_clicks: number;
    period_bots: number;
    period_failed: number;
    days: number;
    distribution_mode: string;
  };
  by_member: MemberStat[];
  daily: DailyPoint[];
  recent: RecentClick[];
}

const DAY_OPTIONS = [7, 30, 90] as const;

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function MiniTrend({ data }: { data: number[] }) {
  if (data.length < 2 || data.every((n) => n === 0)) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-fg">
        No clicks in this period yet.
      </div>
    );
  }
  const width = 400;
  const height = 80;
  const max = Math.max(...data, 1) * 1.15;
  const step = width / (data.length - 1);
  const line = data
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dl-trend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25D366" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#25D366" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dl-trend)" />
      <path d={line} fill="none" stroke="#25D366" strokeWidth="2" />
    </svg>
  );
}

export function DirectLinkReports({ directLinkId }: { directLinkId: string }) {
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/direct-links/${directLinkId}/analytics?days=${days}`);
      const json = (await res.json()) as AnalyticsPayload & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to load report");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [directLinkId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Reports</h2>
          <p className="mt-1 text-sm text-muted-fg">
            See how many people clicked this link, and how clicks are split across your sales team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition",
                  days === d ? "bg-card text-fg shadow-sm" : "text-muted-fg hover:text-fg"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading report…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={MousePointerClick}
              label="All-time clicks"
              value={data.summary.total_clicks}
            />
            <StatCard
              icon={BarChart3}
              label={`Clicks (${data.summary.days}d)`}
              value={data.summary.period_clicks}
            />
            <StatCard
              icon={Users}
              label="Sales receiving clicks"
              value={data.by_member.length}
            />
            <StatCard
              icon={Bot}
              label={`Bots filtered (${data.summary.days}d)`}
              value={data.summary.period_bots}
              muted
            />
          </div>

          {data.summary.period_failed > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {data.summary.period_failed} click(s) in this period did not redirect (e.g. no active
              team members).
            </div>
          )}

          {/* Trend */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">Clicks over time</h3>
              <span className="font-mono text-[11px] text-muted-fg">
                {data.summary.period_clicks} in last {data.summary.days} days
              </span>
            </div>
            <MiniTrend data={data.daily.map((d) => d.clicks)} />
          </div>

          {/* Per sales */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-fg" />
              <h3 className="text-sm font-semibold text-fg">By sales / team member</h3>
            </div>
            <p className="mb-4 text-[11px] text-muted-fg">
              Who received WhatsApp redirects after weighted distribution.
            </p>

            {data.by_member.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-fg">
                No sales assignments yet in this period.
              </p>
            ) : (
              <div className="space-y-3">
                {data.by_member.map((m) => (
                  <div key={`${m.phone || m.name}-${m.member_id || ""}`} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{m.name}</p>
                        {m.phone && (
                          <p className="truncate font-mono text-[11px] text-muted-fg">+{m.phone}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums text-fg">{m.clicks}</p>
                        <p className="text-[11px] text-muted-fg">{m.percent}%</p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#25D366] transition-all"
                        style={{ width: `${Math.max(m.percent, m.clicks > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-fg">Recent clicks</h3>
            {data.recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-fg">No clicks yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-fg">
                      <th className="pb-2 pr-3 font-medium">When</th>
                      <th className="pb-2 pr-3 font-medium">Sales</th>
                      <th className="pb-2 pr-3 font-medium">UTM / Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((c) => (
                      <tr key={c.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-3 tabular-nums text-muted-fg">
                          {formatWhen(c.clicked_at)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="font-medium text-fg">
                            {c.assigned_name || "—"}
                          </span>
                          {c.assigned_phone && (
                            <span className="ml-1.5 font-mono text-muted-fg">
                              +{c.assigned_phone}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-fg">
                          {c.utm_source || c.utm_campaign || c.referrer || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof MousePointerClick;
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-fg">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums tracking-tight",
          muted ? "text-muted-fg" : "text-fg"
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
