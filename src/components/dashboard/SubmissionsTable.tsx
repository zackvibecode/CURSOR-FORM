"use client";

import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useMemo } from "react";

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
}

interface SubmissionsTableProps {
  submissions: SubmissionRow[];
  compact?: boolean;
}

export function SubmissionsTable({ submissions, compact = false }: SubmissionsTableProps) {
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
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-fg">No submissions yet</p>
      </div>
    );
  }

  const baseCols = ["Name", "Phone"];
  const tailCols = ["Form", "Assigned", "Status", "Date"];
  const minWidth = 640 + answerLabels.length * 160;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="sticky top-0">
            <tr className="border-b border-border bg-muted/50">
              {[...baseCols, ...answerLabels, ...tailCols].map((col, i) => (
                <th
                  key={`${col}-${i}`}
                  className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg sm:px-5"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, compact ? 5 : undefined).map((row) => {
              const answerMap = new Map((row.answers ?? []).map((a) => [a.label, a.value]));
              return (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-fg sm:px-5">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-fg sm:px-5">
                    {row.phone}
                  </td>

                  {answerLabels.map((label) => {
                    const val = answerMap.get(label);
                    return (
                      <td
                        key={label}
                        className="max-w-[220px] truncate px-4 py-3 text-muted-fg sm:px-5"
                        title={val || undefined}
                      >
                        {val && val.length > 0 ? val : "—"}
                      </td>
                    );
                  })}

                  <td className="whitespace-nowrap px-4 py-3 text-muted-fg sm:px-5">
                    {row.formName}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {row.assignedTo && row.assignedTo !== "—" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-fg">
                        <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
                        {row.assignedTo}
                      </span>
                    ) : (
                      <span className="text-muted-fg">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <Badge variant={row.status}>{row.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-fg sm:px-5">
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
