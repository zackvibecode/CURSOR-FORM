"use client";

import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

export type SubmissionStatus = "new" | "contacted" | "converted" | "pending";

export interface SubmissionRow {
  id: string;
  name: string;
  phone: string;
  formName: string;
  status: SubmissionStatus;
  date: string;
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

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-12 text-center shadow-card">
        <p className="text-brand-muted">No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg/50">
              {["Name", "Phone", "Form Name", "Team Member", "Status", "Date"].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-muted sm:px-6"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, compact ? 5 : undefined).map((row) => {
              const hasDebug = row.debugInfo && (row.name === "—" || row.phone === "—");
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
                        <div className="absolute z-10 mt-1 rounded-lg border border-brand-border bg-white p-2 shadow-lg text-[10px] font-mono text-brand-muted max-w-[200px] break-all">
                          Keys: {row.debugInfo}
                        </div>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-brand-muted sm:px-6">{row.phone}</td>
                  <td className="px-4 py-4 text-brand-muted sm:px-6">{row.formName}</td>
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
                  <td className="px-4 py-4 text-brand-muted sm:px-6">
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
