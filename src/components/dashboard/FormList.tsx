"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getFormPublicUrl } from "@/lib/forms";
import { FORM_TEMPLATES } from "@/lib/templates";
import { CreateFormButton } from "./DashboardHeader";
import { FormCard, type FormCardData } from "./FormCard";
import { FileText, Link2, Loader2, Plus, Search } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { setPendingInstant } from "@/lib/instant-pending";
import {
  getUnreadSubmissionCount,
  markFormSubmissionsSeen,
  subscribeFormSeenUpdates,
} from "@/lib/form-seen";
import { useEffect, useMemo, useState } from "react";

const MAX_PINNED = 5;
const PINNED_STORAGE_KEY = "oneform_pinned_forms";
const DELETE_CONFIRM_TEXT = "DELETE";

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

async function copyFormLink(slug: string) {
  const url = getFormPublicUrl(slug);
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied", "success");
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

async function shareFormLink(title: string, slug: string) {
  const url = getFormPublicUrl(slug);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // User cancelled or share failed — fall back to copy.
    }
  }
  await copyFormLink(slug);
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
  const [seenTick, setSeenTick] = useState(0);

  const firstName = getFirstName(userName);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">
          Hello {firstName}
          <span className="ml-1" aria-hidden="true">
            👋
          </span>
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-fg" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search form"
          className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted-fg"
        />
        <span className="font-mono text-[11px] text-muted-fg">
          {sortedForms.length}/{forms.length}
        </span>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <CreateFormButton
          onError={setError}
          className="w-full justify-center sm:w-auto sm:flex-1"
        >
          <Plus className="h-4 w-4" />
          New Form
        </CreateFormButton>
        <Button
          variant="outline"
          onClick={() => void handleDirectLinkCreate()}
          disabled={creatingDirectLink}
          className="w-full justify-center sm:w-auto"
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
          className="w-full justify-center sm:w-auto"
        >
          From template
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
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
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedForms.map((form) => {
            const responseCount = form.submissions?.[0]?.count ?? 0;
            const pinned = isPinned(form.id);
            void seenTick;
            const unread = getUnreadSubmissionCount(form.id, responseCount);

            return (
              <FormCard
                key={form.id}
                form={form}
                pinned={pinned}
                unread={unread}
                responseCount={responseCount}
                duplicating={duplicatingId === form.id}
                onPin={() => togglePin(form.id)}
                onCopy={() => void copyFormLink(form.slug)}
                onShare={() => void shareFormLink(form.title, form.slug)}
                onDuplicate={() => void handleDuplicate(form.id)}
                onDelete={() => openDeleteModal(form)}
                onMarkSeen={() => markFormSubmissionsSeen(form.id, responseCount)}
              />
            );
          })}

          {sortedForms.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-fg">
              No forms match &ldquo;{query}&rdquo;
            </div>
          )}
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
