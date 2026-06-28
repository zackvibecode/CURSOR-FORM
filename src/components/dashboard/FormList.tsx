"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getFormPublicUrl } from "@/lib/forms";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/templates";
import { CreateFormButton } from "./DashboardHeader";
import {
  Edit,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Pin,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { useEffect, useMemo, useState } from "react";

const MAX_PINNED = 5;
const PINNED_STORAGE_KEY = "oneform_pinned_forms";

interface FormRow {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  submissions?: { count: number }[];
}

interface FormListProps {
  forms: FormRow[];
}

function StatusPill({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium capitalize",
        status === "published"
          ? "text-whatsapp-deep dark:text-whatsapp"
          : "text-muted-fg"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "published" ? "bg-whatsapp" : "bg-gray-400"
        )}
      />
      {status}
    </span>
  );
}

export function FormList({ forms: initialForms }: FormListProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPinnedIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((p) => p !== id);
      } else {
        if (prev.length >= MAX_PINNED) {
          toast(`You can pin up to ${MAX_PINNED} forms only.`, "error");
          return prev;
        }
        next = [...prev, id];
      }
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage write failure
      }
      return next;
    });
  };

  useEffect(() => {
    async function refreshForms() {
      const res = await fetch("/api/forms");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.forms)) {
        setForms(data.forms);
      }
    }

    refreshForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;

    setDeletingId(id);
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      setForms((prev) => prev.filter((f) => f.id !== id));
      router.refresh();
    }
    setDeletingId(null);
  };

  const handleCopy = async (slug: string, id: string) => {
    await navigator.clipboard.writeText(getFormPublicUrl(slug));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTemplateCreate = async (templateId: string) => {
    setCreatingTemplateId(templateId);
    setError("");

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();

      if (!res.ok || !data.form) {
        setError(data.error ?? "Failed to create form from template.");
        return;
      }

      setTemplateOpen(false);
      router.push(`/dashboard/forms/${data.form.id}/edit`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const isPinned = (id: string) => pinnedIds.includes(id);

  const sortedForms = useMemo(() => {
    const filtered = forms.filter((f) =>
      query.trim() === ""
        ? true
        : f.title.toLowerCase().includes(query.toLowerCase()) ||
          f.slug.toLowerCase().includes(query.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const ap = pinnedIds.indexOf(a.id);
      const bp = pinnedIds.indexOf(b.id);
      if (ap !== -1 && bp !== -1) return ap - bp;
      if (ap !== -1) return -1;
      if (bp !== -1) return 1;
      return 0;
    });
  }, [forms, pinnedIds, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Forms</h1>
          <p className="text-sm text-muted-fg">Create and manage your WhatsApp lead forms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplateOpen(true)}>
            From template
          </Button>
          <CreateFormButton onError={setError} />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-fg">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="mb-1 text-sm font-semibold text-fg">No forms yet</h2>
          <p className="mb-5 max-w-sm text-sm text-muted-fg">
            Create your first WhatsApp form to start collecting leads.
          </p>
          <CreateFormButton onError={setError} />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-fg" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forms…"
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted-fg"
            />
            <span className="font-mono text-[11px] text-muted-fg">
              {sortedForms.length} of {forms.length}
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-8 px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Submissions
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Updated
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedForms.map((form) => {
                  const responseCount = form.submissions?.[0]?.count ?? 0;
                  const pinned = isPinned(form.id);
                  return (
                    <tr
                      key={form.id}
                      className={cn(
                        "group border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                        pinned && "bg-whatsapp/[0.03]"
                      )}
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => togglePin(form.id)}
                          title={pinned ? "Unpin form" : "Pin form"}
                          aria-label={pinned ? "Unpin form" : "Pin form"}
                          className={cn(
                            "rounded-md p-1 transition-colors",
                            pinned
                              ? "text-whatsapp-deep dark:text-whatsapp"
                              : "text-muted-fg/40 hover:bg-muted hover:text-muted-fg"
                          )}
                        >
                          <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/dashboard/forms/${form.id}/edit`}
                          className="block max-w-[260px] truncate font-medium text-fg hover:text-whatsapp-deep dark:hover:text-whatsapp"
                        >
                          {form.title}
                        </Link>
                        <span className="block max-w-[260px] truncate font-mono text-[11px] text-muted-fg">
                          /f/{form.slug}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={form.status} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-fg">
                        {responseCount}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-xs text-muted-fg">
                        {formatDate(form.updated_at)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                          <Link
                            href={`/dashboard/forms/${form.id}/edit`}
                            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>

                          {form.status === "published" && (
                            <>
                              <button
                                onClick={() => handleCopy(form.slug, form.id)}
                                className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                                title="Copy link"
                              >
                                {copiedId === form.id ? (
                                  <Check className="h-3.5 w-3.5 text-whatsapp" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <a
                                href={getFormPublicUrl(form.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                                title="Open"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => handleDelete(form.id)}
                            disabled={deletingId === form.id}
                            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedForms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-fg">
                      No forms match &ldquo;{query}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="Choose a template" size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          {FORM_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateCreate(template.id)}
              disabled={creatingTemplateId !== null}
              className="rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-fg/30 hover:bg-muted disabled:opacity-60"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-fg">
                <Plus className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-fg">{template.name}</h3>
              <p className="mt-0.5 text-xs text-muted-fg">{template.description}</p>
              {creatingTemplateId === template.id && (
                <span className="mt-2 inline-flex items-center gap-2 text-xs text-whatsapp-deep dark:text-whatsapp">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </span>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
