"use client";

import { useMemo, useState } from "react";
import { Download, Calendar } from "lucide-react";
import { SubmissionsTable, type SubmissionRow } from "./SubmissionsTable";
import { cn } from "@/lib/utils";

type DatePreset = "all" | "today" | "week" | "month" | "year" | "custom";

interface SubmissionsExplorerProps {
  submissions: SubmissionRow[];
}

function startOfRange(preset: DatePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return null;
  }
}

const presetLabels: { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "Last month" },
  { id: "year", label: "Last year" },
  { id: "custom", label: "Custom" },
];

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function SubmissionsExplorer({ submissions }: SubmissionsExplorerProps) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filtered = useMemo(() => {
    if (preset === "all") return submissions;

    if (preset === "custom") {
      const start = customStart ? new Date(customStart + "T00:00:00") : null;
      const end = customEnd ? new Date(customEnd + "T23:59:59") : null;
      return submissions.filter((s) => {
        const d = new Date(s.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    const start = startOfRange(preset);
    if (!start) return submissions;
    return submissions.filter((s) => new Date(s.date) >= start);
  }, [submissions, preset, customStart, customEnd]);

  function handleExport() {
    const headers = ["Name", "Phone", "Form Name", "Team Member", "Status", "Date"];
    const rows = filtered.map((s) => [
      s.name,
      s.phone,
      s.formName,
      s.assignedTo && s.assignedTo !== "—" ? s.assignedTo : "",
      s.status,
      new Date(s.date).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((cols) => cols.map((c) => escapeCsv(String(c ?? ""))).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `submissions-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Calendar className="mr-1 h-3.5 w-3.5 text-muted-fg" />
          {presetLabels.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                preset === p.id
                  ? "bg-fg text-bg"
                  : "text-muted-fg hover:bg-muted hover:text-fg"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors",
            filtered.length === 0
              ? "cursor-not-allowed text-muted-fg/50"
              : "text-fg hover:bg-muted"
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-fg">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg outline-none focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-fg">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-fg outline-none focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-fg">
          Showing <span className="font-mono font-medium text-fg">{filtered.length}</span>{" "}
          submission{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <SubmissionsTable submissions={filtered} />
    </div>
  );
}
