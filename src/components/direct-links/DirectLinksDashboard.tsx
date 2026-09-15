"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Link2, Plus, Copy, Check, ExternalLink, Trash2, Edit2,
  Loader2, Search, BarChart3, Users, Globe, FileText, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrCodeModal } from "@/components/ui/QrCodeModal";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { toPublicQrUrl } from "@/lib/qr";
import type { DirectLink } from "@/lib/database.types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

function getPublicUrl(slug: string) {
  const base = APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/d/${slug}`;
}

const MODE_LABELS: Record<string, string> = {
  single:      "Single",
  distribute:  "Distribute",
  conditional: "Conditional",
};

interface DirectLinksDashboardProps {
  directLinks: DirectLink[];
}

export function DirectLinksDashboard({ directLinks: initialLinks }: DirectLinksDashboardProps) {
  const router  = useRouter();
  const [links, setLinks]   = useState<DirectLink[]>(initialLinks);
  const [query, setQuery]   = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DirectLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [qrTarget, setQrTarget] = useState<DirectLink | null>(null);

  const filtered = links.filter(
    (l) =>
      query.trim() === "" ||
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.slug.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/direct-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Direct Link" }),
      });
      const data = await res.json() as { direct_link?: DirectLink; error?: string };
      if (!res.ok || !data.direct_link) {
        toast(data.error ?? "Failed to create", "error");
        return;
      }
      router.push(`/dashboard/direct-links/${data.direct_link.id}/edit`);
    } catch {
      toast("Network error", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = useCallback(async (link: DirectLink) => {
    // Cache-bust so WhatsApp re-scrapes OG image instead of showing old favicon
    const url = `${getPublicUrl(link.slug)}?og=${Date.parse(link.updated_at) || Date.now()}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(link.id);
    toast("Link copied! Paste as a new WhatsApp message for image preview.", "success");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/direct-links/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
        toast("Direct Link deleted", "success");
        setDeleteTarget(null);
        setDeleteConfirm("");
        router.refresh();
      } else {
        toast("Failed to delete", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Direct Links</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Create links that send visitors directly to WhatsApp — no form required.
          </p>
        </div>
        <Button onClick={() => void handleCreate()} disabled={creating} className="shrink-0">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create Direct Link
        </Button>
      </div>

      {/* Search */}
      {links.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-fg" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search direct links…"
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-muted-fg"
          />
          <span className="font-mono text-[11px] text-muted-fg">
            {filtered.length}/{links.length}
          </span>
        </div>
      )}

      {/* Empty state */}
      {links.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-fg">
            <Link2 className="h-5 w-5" />
          </div>
          <h2 className="mb-1 text-sm font-semibold text-fg">No Direct Links yet</h2>
          <p className="mb-5 max-w-sm text-sm text-muted-fg">
            Create your first Direct Link. Visitors click the link and go straight to WhatsApp —
            no form to fill.
          </p>
          <Button onClick={() => void handleCreate()} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Direct Link
          </Button>
        </div>
      )}

      {/* Links grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((link) => {
            const publicUrl = getPublicUrl(link.slug);
            const isCopied  = copiedId === link.id;
            return (
              <div
                key={link.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-fg/20"
              >
                {/* Status badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                      link.status === "published"
                        ? "border-whatsapp/30 bg-whatsapp/5 text-whatsapp-deep dark:text-whatsapp"
                        : "border-border bg-muted text-muted-fg"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        link.status === "published" ? "bg-whatsapp" : "bg-gray-400"
                      )}
                    />
                    {link.status}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-fg">
                    {MODE_LABELS[link.distribution_mode] ?? link.distribution_mode}
                  </span>
                </div>

                {/* Name */}
                <h3 className="mb-1 truncate text-sm font-semibold text-fg">{link.name}</h3>

                {/* Slug */}
                <p className="mb-3 truncate font-mono text-xs text-muted-fg">/d/{link.slug}</p>

                {/* Stats row */}
                <div className="mb-4 flex items-center gap-4 text-xs text-muted-fg">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>{link.total_clicks} clicks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="capitalize">{MODE_LABELS[link.distribution_mode]}</span>
                  </div>
                </div>

                {/* Public URL display */}
                <div className="mb-4 overflow-hidden rounded-md border border-border bg-muted px-3 py-1.5">
                  <p className="truncate font-mono text-[11px] text-muted-fg">{publicUrl}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleCopy(link)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      isCopied
                        ? "border-whatsapp/30 bg-whatsapp/5 text-whatsapp-deep dark:text-whatsapp"
                        : "border-border bg-card text-muted-fg hover:border-fg/30 hover:text-fg"
                    )}
                    title="Copy link"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-fg transition-colors hover:border-fg/30 hover:text-fg"
                    title="Open link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>

                  <Link
                    href={`/dashboard/direct-links/${link.id}/edit`}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-fg transition-colors hover:border-fg/30 hover:text-fg"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => setQrTarget(link)}
                    className="flex items-center justify-center rounded-md border border-border bg-card p-1.5 text-muted-fg transition-colors hover:border-fg/30 hover:text-fg"
                    title="QR code"
                    aria-label="Show QR code"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDeleteTarget(link); setDeleteConfirm(""); }}
                    className="flex items-center justify-center rounded-md border border-border bg-card p-1.5 text-muted-fg/50 transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Created date */}
                <p className="mt-3 text-[10px] text-muted-fg/60">
                  Created {new Date(link.created_at).toLocaleDateString("en-MY", { dateStyle: "medium" })}
                </p>
              </div>
            );
          })}

          {filtered.length === 0 && query && (
            <div className="col-span-full rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-fg">
              No direct links match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* ── QR code modal ─────────────────────────────────────────────────── */}
      <QrCodeModal
        open={qrTarget !== null}
        onClose={() => setQrTarget(null)}
        url={qrTarget ? toPublicQrUrl(getPublicUrl(qrTarget.slug)) : ""}
        title="Direct Link QR"
        subtitle={qrTarget?.name}
      />

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-sm font-semibold text-fg">Delete Direct Link?</h3>
            <p className="mb-4 text-sm text-muted-fg">
              This will permanently delete{" "}
              <span className="font-medium text-fg">&ldquo;{deleteTarget.name}&rdquo;</span>{" "}
              and all its click history. This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs text-muted-fg">
                Type <span className="font-mono font-semibold text-fg">DELETE</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-fg outline-none focus:border-fg/30 focus:ring-1 focus:ring-fg/10"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={deleteConfirm !== "DELETE" || deletingId === deleteTarget.id}
                onClick={() => void handleDelete()}
              >
                {deletingId === deleteTarget.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
                ) : (
                  "Delete permanently"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
