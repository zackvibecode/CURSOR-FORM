"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMemberRow } from "@/lib/team-analytics";

type Mode = "count" | "percent";

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-amber-400 text-white"
      : rank === 2
        ? "bg-slate-300 text-slate-700"
        : rank === 3
          ? "bg-amber-700 text-white"
          : "bg-muted text-muted-fg";
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
        style
      )}
    >
      {rank}
    </span>
  );
}

export function TeamLeaderboard({
  rows,
  membersCount,
}: {
  rows: TeamMemberRow[];
  membersCount: number;
}) {
  const [mode, setMode] = useState<Mode>("count");
  const maxClicks = Math.max(...rows.map((row) => row.clicks), 1);

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-fg" strokeWidth={2} />
          <div>
            <h2 className="text-base font-semibold text-fg">Team Member Leaderboard</h2>
            <p className="mt-0.5 text-xs text-muted-fg">
              {mode === "count"
                ? "Ranked by number of WhatsApp redirects received."
                : "Ranked by share of WhatsApp redirects received."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setMode("count")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "count"
                ? "bg-whatsapp text-white shadow-sm"
                : "text-muted-fg hover:text-fg"
            )}
          >
            By total redirects
          </button>
          <button
            type="button"
            onClick={() => setMode("percent")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "percent"
                ? "bg-whatsapp text-white shadow-sm"
                : "text-muted-fg hover:text-fg"
            )}
          >
            By percentage
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-fg">
          No team members yet. Add sales members to your direct links to see distribution here.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-fg">
                <th className="w-12 py-2 pr-3 font-semibold">#</th>
                <th className="py-2 pr-4 font-semibold">Team member</th>
                <th className="py-2 pr-4 font-semibold">
                  {mode === "count" ? "WhatsApp redirects" : "Share"}
                </th>
                <th className="w-20 py-2 text-right font-semibold">
                  {mode === "count" ? "Share" : "Redirects"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const width =
                  mode === "count"
                    ? (row.clicks / maxClicks) * 100
                    : row.clicks > 0
                      ? row.percent
                      : 0;
                const initial = (row.name.trim()[0] ?? "?").toUpperCase();

                return (
                  <tr key={row.key} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-fg">
                          {initial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold uppercase tracking-wide text-fg">
                            {row.name}
                          </p>
                          {row.phone && (
                            <p className="truncate font-mono text-[11px] text-muted-fg">
                              +{row.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-whatsapp transition-all"
                          style={{ width: `${Math.max(width, row.clicks > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 pl-2 text-right align-middle">
                      <span className="block font-mono text-sm font-semibold tabular-nums text-fg">
                        {mode === "count" ? row.clicks.toLocaleString("en-US") : `${row.percent}%`}
                      </span>
                      <span className="block font-mono text-[11px] tabular-nums text-muted-fg">
                        {mode === "count" ? `${row.percent}%` : row.clicks.toLocaleString("en-US")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="mt-3 text-[11px] text-muted-fg">
            {membersCount} member{membersCount === 1 ? "" : "s"} tracked
          </p>
        </div>
      )}
    </section>
  );
}
