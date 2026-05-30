"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Crown, RefreshCw, Check, X } from "lucide-react";

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
        <div className="flex gap-2">
          {(["pending", "all"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors " +
                (tab === t
                  ? "bg-whatsapp/10 text-whatsapp-deep"
                  : "text-brand-muted hover:bg-gray-50")
              }
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-muted hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-brand-border bg-white p-12 text-center text-brand-muted">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-white p-12 text-center text-brand-muted">
          {tab === "pending" ? "No pending requests." : "No subscriptions yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-brand-border bg-gray-50/50 text-left text-xs uppercase text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Cycle</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-brand-text">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-medium capitalize text-brand-text">
                      {row.plan !== "free" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      {row.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-brand-muted">
                    {row.billing_cycle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === "pending" ? "pending" : "converted"}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {row.status === "pending" ? (
                        <>
                          <button
                            disabled={busyId === row.user_id}
                            onClick={() => act(row.user_id, "approve")}
                            className="inline-flex items-center gap-1 rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0DB849] disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            disabled={busyId === row.user_id}
                            onClick={() => act(row.user_id, "reject")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
