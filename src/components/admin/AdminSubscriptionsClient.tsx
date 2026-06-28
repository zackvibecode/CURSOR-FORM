"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Crown, RefreshCw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionRow {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  status: string;
  billing_cycle: string | null;
  started_at: string | null;
  updated_at: string;
}

type FilterTab = "pending" | "all";

export function AdminSubscriptionsClient() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        tab === "pending"
          ? "/api/admin/subscriptions?status=pending"
          : "/api/admin/subscriptions";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setRows(json.subscriptions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (userId: string, action: "approve" | "reject") => {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["pending", "all"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                tab === t
                  ? "bg-fg text-bg"
                  : "text-muted-fg hover:bg-muted hover:text-fg"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-fg transition-colors hover:bg-muted hover:text-fg"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-fg">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-fg">
          {tab === "pending" ? "No pending requests." : "No subscriptions yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    User
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Cycle
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-fg">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 capitalize text-fg">
                        {row.plan !== "free" && (
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        {row.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-fg">
                      {row.billing_cycle ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === "pending" ? "pending" : "converted"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {row.status === "pending" ? (
                          <>
                            <button
                              disabled={busyId === row.user_id}
                              onClick={() => act(row.user_id, "approve")}
                              className="inline-flex items-center gap-1 rounded-md bg-fg px-2.5 py-1 text-xs font-medium text-bg transition-colors hover:bg-gray-600 dark:hover:bg-gray-200 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              disabled={busyId === row.user_id}
                              onClick={() => act(row.user_id, "reject")}
                              className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-fg">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
