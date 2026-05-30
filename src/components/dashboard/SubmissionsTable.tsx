"use client";

import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useMemo, useState } from "react";

export type SubmissionStatus = "new" | "contacted" | "converted" | "pending";

export interface SubmissionRow {
  id: string;
  name: string;
  phone: string;
  formName: string;
  status: SubmissionStatus;
  date: string;
  answers?: { label: string; value: string }[];
  assignedTo?: string;
  assignedName?: string | null;
  assignedPhone?: string | null;
  debugInfo?: string | null;
}

interface SubmissionsTableProps {
  submissions: SubmissionRow[];
  compact?: boolean;
}

export function SubmissionsTable({ submissions, compact = false }: SubmissionsTableProps) {
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Build dynamic answer columns from the union of all field labels (full view only)
  const answerLabels = useMemo(() => {
    if (compact) return [];
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const row of submissions) {
      for (const a of row.answers ?? []) {
        if (!seen.has(a.label)) {
          seen.add(a.label);
          labels.push(a.label);
        }
      }
    }
    return labels;
  }, [submissions, compact]);

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-12 text-center shadow-card">
        <p className="text-brand-muted">No submissions yet</p>
      </div>
    );
  }

  const baseCols = ["Name", "Phone"];
  const tailCols = ["Form Name", "Team Member", "Status", "Date"];
  const minWidth = 640 + answerLabels.length * 160;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg/50">
              {[...baseCols, ...answerLabels, ...tailCols].map((col, i) => (
                <th
                  key={`${col}-${i}`}
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-muted sm:px-6"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, compact ? 5 : undefined).map((row) => {
              const hasDebug = row.debugInfo && (row.name === "—" || row.phone === "—");
              const answerMap = new Map((row.answers ?? []).map((a) => [a.label, a.value]));
              return (
                <tr
                  key={row.id}
                  className="border-b border-brand-border/60 transition-colors last:border-0 hover:bg-brand-bg/40"
                >
                  <td className="px-4 py-4 font-medium text-brand-text sm:px-6">
                    <span className="relative inline-block">
                      {row.name}
                      {hasDebug && (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          N/A
                          <button
                            onClick={() => setViewingId(viewingId === row.id ? null : row.id)}
                            className="underline"
                            title="View raw data keys"
                          >
                            ?
                          </button>
                        </span>
                      )}
                      {viewingId === row.id && hasDebug && (
                        <div className="absolute z-10 mt-1 max-w-[200px] break-all rounded-lg border border-brand-border bg-white p-2 font-mono text-[10px] text-brand-muted shadow-lg">
                          Keys: {row.debugInfo}
                        </div>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-brand-muted sm:px-6">{row.phone}</td>

                  {answerLabels.map((label) => {
                    const val = answerMap.get(label);
                    return (
                      <td
                        key={label}
                        className="max-w-[220px] truncate px-4 py-4 text-brand-muted sm:px-6"
                        title={val || undefined}
                      >
                        {val && val.length > 0 ? val : "—"}
                      </td>
                    );
                  })}

                  <td className="whitespace-nowrap px-4 py-4 text-brand-muted sm:px-6">{row.formName}</td>
                  <td className="px-4 py-4 sm:px-6">
                    {row.assignedTo && row.assignedTo !== "—" ? (
                      <span className="inline-flex items-center rounded-full bg-whatsapp/10 px-2.5 py-1 text-xs font-medium text-whatsapp-deep">
                        {row.assignedTo}
                      </span>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <Badge variant={row.status}>{row.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-brand-muted sm:px-6">
                    {formatDate(row.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
