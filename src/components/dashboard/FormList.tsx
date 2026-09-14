"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { getFormPublicUrl } from "@/lib/forms";
import { isDirectLinkForm } from "@/lib/form-settings";
import { FORM_TEMPLATES } from "@/lib/templates";
import { CreateFormButton } from "./DashboardHeader";
import { cn, formatDateOnly, formatTime } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Files,
  Filter,
  LayoutTemplate,
  Link2,
  Loader2,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { setPendingInstant } from "@/lib/instant-pending";
import {
  getUnreadSubmissionCount,
  markFormSubmissionsSeen,
  subscribeFormSeenUpdates,
} from "@/lib/form-seen";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_PINNED = 5;
const PINNED_STORAGE_KEY = "oneform_pinned_forms";
const DELETE_CONFIRM_TEXT = "DELETE";
const PAGE_SIZE = 10;

export interface FormCardData {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  created_at?: string;
  settings?: unknown;
  submissions?: { count: number }[];
}

interface FormListProps {
  forms: FormCardData[];
  userName?: string | null;
}

function getFirstName(userName?: string | null) {
  if (!userName?.trim()) return "there";
  const name = userName.trim();
  if (name.includes("@")) return name.split("@")[0] ?? "there";
  return name.split(/\s+/)[0] ?? "there";
}

async function copyFormLink(slug: string, updatedAt?: string) {
  const url = `${getFormPublicUrl(slug)}?og=${Date.parse(updatedAt ?? "") || Date.now()}`;
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied — paste as a new WhatsApp message for image preview", "success");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast("Link copied", "success");
  }
}

async function shareFormLink(title: string, slug: string, updatedAt?: string) {
  const url = `${getFormPublicUrl(slug)}?og=${Date.parse(updatedAt ?? "") || Date.now()}`;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // fall through to copy
    }
  }
  await copyFormLink(slug, updatedAt);
}

function StatusPill({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium capitalize",
        status === "published" ? "text-whatsapp-deep dark:text-whatsapp" : "text-muted-fg"
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

function HeroIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-32 w-full max-w-sm shrink-0 items-center justify-center overflow-hidden rounded-xl bg-whatsapp/[0.06] lg:flex"
    >
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-whatsapp/10 blur-2xl" />
      <div className="absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-whatsapp/10 blur-2xl" />

      <span className="absolute left-5 top-5 max-w-[8rem] text-base font-semibold italic leading-tight text-whatsapp-deep dark:text-whatsapp">
        More conversations
        <br />
        More customers
      </span>

      <span className="absolute bottom-5 right-6 max-w-[8rem] text-right text-xs font-medium italic text-muted-fg">
        &ldquo;Simple forms.
        <br />
        Real connections.&rdquo;
      </span>

      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-whatsapp text-white shadow-md">
        <WhatsAppIcon className="h-7 w-7" />
      </div>
    </div>
  );
}

function RowActions({
  form,
  pinned,
  duplicating,
  onCopy,
  onShare,
  onDuplicate,
  onPin,
  onDelete,
}: {
  form: FormCardData;
  pinned: boolean;
  duplicating: boolean;
  onCopy: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isPublished = form.status === "published";

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 160) });
    setOpen(true);
  };

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-fg"
        aria-label="Form actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-50 w-40 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md"
          >
          <Link
            href={`/dashboard/forms/${form.id}/edit`}
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open editor
          </Link>
          <button
            type="button"
            disabled={!isPublished}
            onClick={() => {
              setOpen(false);
              onCopy();
            }}
            className={itemClass}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </button>
          <button
            type="button"
            disabled={!isPublished}
            onClick={() => {
              setOpen(false);
              onShare();
            }}
            className={itemClass}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            type="button"
            disabled={duplicating}
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className={itemClass}
          >
            {duplicating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Files className="h-3.5 w-3.5" />
            )}
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onPin();
            }}
            className={itemClass}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current text-whatsapp-deep")} />
            {pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-500 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          </div>,
          document.body
        )}
    </>
  );
}

export function FormList({ forms: initialForms, userName }: FormListProps) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmFirst, setDeleteConfirmFirst] = useState("");
  const [deleteConfirmSecond, setDeleteConfirmSecond] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [creatingDirectLink, setCreatingDirectLink] = useState(false);
  const [error, setError] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [publishedOnly, setPublishedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [seenTick, setSeenTick] = useState(0);
  const [greeting, setGreeting] = useState("Welcome back");

  const firstName = getFirstName(userName);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,");
  }, []);

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  useEffect(() => {
    return subscribeFormSeenUpdates(() => setSeenTick((n) => n + 1));
  }, []);

  useEffect(() => {
    const list = forms.map((f) => ({
      id: f.id,
      count: f.submissions?.[0]?.count ?? 0,
    }));
    for (const item of list) {
      getUnreadSubmissionCount(item.id, item.count);
    }
  }, [forms]);

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

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteConfirmFirst("");
    setDeleteConfirmSecond("");
  };

  const openDeleteModal = (form: FormCardData) => {
    setDeleteTarget({ id: form.id, title: form.title });
    setDeleteConfirmFirst("");
    setDeleteConfirmSecond("");
  };

  const canPermanentlyDelete =
    deleteConfirmFirst === DELETE_CONFIRM_TEXT &&
    deleteConfirmSecond === DELETE_CONFIRM_TEXT;

  const handlePermanentDelete = async () => {
    if (!deleteTarget || !canPermanentlyDelete) return;

    setDeletingId(deleteTarget.id);
    const res = await fetch(`/api/forms/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setForms((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast("Form deleted permanently", "success");
      closeDeleteModal();
      router.refresh();
    } else {
      toast("Failed to delete form", "error");
    }
    setDeletingId(null);
  };

  const handleDuplicate = async (id: string) => {
    setPendingInstant(setDuplicatingId, id);
    setError("");

    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.form) {
        setError(data.message ?? data.error ?? "Failed to duplicate form.");
        return;
      }

      setForms((prev) => [data.form, ...prev]);
      toast("Form duplicated", "success");
      router.push(`/dashboard/forms/${data.form.id}/edit`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
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

  const handleDirectLinkCreate = async () => {
    setCreatingDirectLink(true);
    setError("");

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "direct" }),
      });
      const data = await res.json();

      if (!res.ok || !data.form) {
        setError(data.message ?? data.error ?? "Failed to create direct link.");
        return;
      }

      router.push(`/dashboard/forms/${data.form.id}/edit`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreatingDirectLink(false);
    }
  };

  const isPinned = (id: string) => pinnedIds.includes(id);

  const sortedForms = useMemo(() => {
    const filtered = forms.filter((f) => {
      if (publishedOnly && f.status !== "published") return false;
      if (query.trim() === "") return true;
      const q = query.toLowerCase();
      return f.title.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      const ap = pinnedIds.indexOf(a.id);
      const bp = pinnedIds.indexOf(b.id);
      if (ap !== -1 && bp !== -1) return ap - bp;
      if (ap !== -1) return -1;
      if (bp !== -1) return 1;
      return 0;
    });
  }, [forms, pinnedIds, query, publishedOnly]);

  const lastPage = Math.max(1, Math.ceil(sortedForms.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, publishedOnly]);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const pageItems = sortedForms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Read the seen-store so unread badges refresh when it changes.
  void seenTick;

  const renderFormActions = (form: FormCardData, pinned: boolean) => (
    <RowActions
      form={form}
      pinned={pinned}
      duplicating={duplicatingId === form.id}
      onCopy={() => void copyFormLink(form.slug, form.updated_at)}
      onShare={() => void shareFormLink(form.title, form.slug, form.updated_at)}
      onDuplicate={() => void handleDuplicate(form.id)}
      onPin={() => togglePin(form.id)}
      onDelete={() => openDeleteModal(form)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-fg">{greeting}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">
              Hello {firstName}
              <span className="ml-1" aria-hidden="true">
                👋
              </span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-fg">
              Build forms, create direct links, and connect your audience to WhatsApp — all in one
              place.
            </p>
          </div>
          <HeroIllustration />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <CreateFormButton onError={setError} className="justify-center sm:flex-1">
            <Plus className="h-4 w-4" />
            New Form
          </CreateFormButton>
          <Button
            variant="outline"
            onClick={() => void handleDirectLinkCreate()}
            disabled={creatingDirectLink}
            className="justify-center sm:flex-1"
          >
            {creatingDirectLink ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            New Direct Link
          </Button>
          <Button
            variant="outline"
            onClick={() => setTemplateOpen(true)}
            className="justify-center sm:flex-1"
          >
            <LayoutTemplate className="h-4 w-4" />
            From Template
          </Button>
        </div>
      </section>

      {/* Your Forms */}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-fg" strokeWidth={2} />
            <div>
              <h2 className="text-sm font-semibold text-fg">Your Forms</h2>
              <p className="text-xs text-muted-fg">
                Manage your forms and view their performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-fg" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search forms..."
                className="w-36 bg-transparent text-xs text-fg outline-none placeholder:text-muted-fg sm:w-44"
              />
            </div>
            <button
              type="button"
              onClick={() => setPublishedOnly((v) => !v)}
              title={publishedOnly ? "Showing published only" : "Show published only"}
              aria-pressed={publishedOnly}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg text-muted-fg transition-colors hover:text-fg",
                publishedOnly && "border-whatsapp/40 bg-whatsapp/5 text-whatsapp-deep dark:text-whatsapp"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-fg">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="mb-1 text-sm font-semibold text-fg">No forms yet</h2>
            <p className="mb-5 max-w-sm text-sm text-muted-fg">
              Create your first WhatsApp form to start collecting leads.
            </p>
            <CreateFormButton onError={setError}>
              <Plus className="h-4 w-4" />
              New Form
            </CreateFormButton>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-fg">
            {query ? `No forms match “${query}”` : "No published forms yet."}
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="divide-y divide-border md:hidden">
              {pageItems.map((form) => {
                const responseCount = form.submissions?.[0]?.count ?? 0;
                const pinned = isPinned(form.id);
                const unread = getUnreadSubmissionCount(form.id, responseCount);
                const isDirect = isDirectLinkForm(form);
                const displayUrl = getFormPublicUrl(form.slug).replace(/^https?:\/\//, "");

                return (
                  <div key={form.id} className={cn("p-4", pinned && "bg-whatsapp/[0.03]")}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp">
                        {isDirect ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/dashboard/forms/${form.id}/edit`}
                            className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wide text-fg"
                          >
                            {form.title}
                          </Link>
                          {renderFormActions(form, pinned)}
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-muted-fg">
                          {displayUrl}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusPill status={form.status} />
                          {unread > 0 && (
                            <Link
                              href="/dashboard/submissions"
                              onClick={() => markFormSubmissionsSeen(form.id, responseCount)}
                              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-whatsapp px-1.5 text-[10px] font-bold leading-none text-white"
                            >
                              {unread > 99 ? "99+" : unread}
                            </Link>
                          )}
                          <span className="font-mono text-[11px] tabular-nums text-muted-fg">
                            {responseCount} submission{responseCount === 1 ? "" : "s"}
                          </span>
                          <span className="font-mono text-[11px] text-muted-fg/80">
                            {formatDateOnly(form.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto scrollbar-thin md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Name", "URL", "Status", "Submissions", "Updated", ""].map((col, i) => (
                      <th
                        key={`${col}-${i}`}
                        className={cn(
                          "whitespace-nowrap px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg",
                          i === 5 && "text-right"
                        )}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((form) => {
                    const responseCount = form.submissions?.[0]?.count ?? 0;
                    const pinned = isPinned(form.id);
                    const unread = getUnreadSubmissionCount(form.id, responseCount);
                    const isDirect = isDirectLinkForm(form);
                    const displayUrl = getFormPublicUrl(form.slug).replace(/^https?:\/\//, "");

                    return (
                      <tr
                        key={form.id}
                        className={cn(
                          "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30",
                          pinned && "bg-whatsapp/[0.03]"
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp">
                              {isDirect ? (
                                <Link2 className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </span>
                            <Link
                              href={`/dashboard/forms/${form.id}/edit`}
                              className="max-w-[16rem] truncate text-xs font-semibold uppercase tracking-wide text-fg transition-colors hover:text-whatsapp-deep dark:hover:text-whatsapp"
                            >
                              {form.title}
                            </Link>
                            {unread > 0 && (
                              <Link
                                href="/dashboard/submissions"
                                onClick={() => markFormSubmissionsSeen(form.id, responseCount)}
                                title={`${unread} new submission${unread === 1 ? "" : "s"}`}
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-whatsapp px-1.5 text-[10px] font-bold leading-none text-white"
                              >
                                {unread > 99 ? "99+" : unread}
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-fg">
                          <span className="block max-w-[16rem] truncate">{displayUrl}</span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={form.status} />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs tabular-nums text-fg">
                          {responseCount}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-fg">
                          <span className="block">{formatDateOnly(form.updated_at)}</span>
                          <span className="block text-muted-fg/80">
                            {formatTime(form.updated_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {renderFormActions(form, pinned)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-fg">
                Showing {pageItems.length} of {sortedForms.length} forms
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Choose a template"
        size="lg"
      >
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

      <Modal
        open={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Delete form permanently?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-fg">
            You are about to permanently delete{" "}
            <span className="font-medium text-fg">&ldquo;{deleteTarget?.title}&rdquo;</span>. This
            removes all fields and submissions. This cannot be undone.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="deleteConfirmFirst">
                Type <span className="font-mono font-semibold text-fg">{DELETE_CONFIRM_TEXT}</span>{" "}
                to continue
              </Label>
              <Input
                id="deleteConfirmFirst"
                value={deleteConfirmFirst}
                onChange={(e) => setDeleteConfirmFirst(e.target.value)}
                placeholder={DELETE_CONFIRM_TEXT}
                className="mt-1.5 font-mono"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="deleteConfirmSecond">
                Type <span className="font-mono font-semibold text-fg">{DELETE_CONFIRM_TEXT}</span>{" "}
                again to confirm
              </Label>
              <Input
                id="deleteConfirmSecond"
                value={deleteConfirmSecond}
                onChange={(e) => setDeleteConfirmSecond(e.target.value)}
                placeholder={DELETE_CONFIRM_TEXT}
                className="mt-1.5 font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!canPermanentlyDelete || deletingId === deleteTarget?.id}
              onClick={() => void handlePermanentDelete()}
            >
              {deletingId === deleteTarget?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
