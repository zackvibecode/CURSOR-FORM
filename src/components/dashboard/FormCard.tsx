"use client";

import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Files,
  Loader2,
  MoreHorizontal,
  Pin,
  Share2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getFormPublicUrl } from "@/lib/forms";

export interface FormCardData {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  submissions?: { count: number }[];
}

interface FormCardProps {
  form: FormCardData;
  pinned: boolean;
  unread: number;
  responseCount: number;
  duplicating?: boolean;
  onPin: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMarkSeen: () => void;
}

const iconBtnClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-fg transition-colors touch-manipulation hover:border-whatsapp/40 hover:bg-whatsapp/5 hover:text-whatsapp-deep active:scale-[0.98] dark:hover:text-whatsapp disabled:opacity-40 disabled:pointer-events-none";

function StatusPill({ status }: { status: "draft" | "published" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium capitalize",
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

export function FormCard({
  form,
  pinned,
  unread,
  responseCount,
  duplicating = false,
  onPin,
  onCopy,
  onShare,
  onDuplicate,
  onDelete,
  onMarkSeen,
}: FormCardProps) {
  const publicUrl = getFormPublicUrl(form.slug);
  const displayUrl = publicUrl.replace(/^https?:\/\//, "");
  const isPublished = form.status === "published";

  return (
    <article
      className={cn(
        "relative rounded-xl border border-border bg-card p-4 transition-colors",
        pinned && "border-whatsapp/30 bg-whatsapp/[0.03]"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onPin}
          title={pinned ? "Unpin form" : "Pin form"}
          aria-label={pinned ? "Unpin form" : "Pin form"}
          className={cn(
            "rounded-md p-1.5 transition-colors touch-manipulation",
            pinned
              ? "text-whatsapp-deep dark:text-whatsapp"
              : "text-muted-fg/50 hover:bg-muted hover:text-muted-fg"
          )}
        >
          <Pin className={cn("h-4 w-4", pinned && "fill-current")} />
        </button>

        {unread > 0 && (
          <Link
            href="/dashboard/submissions"
            onClick={onMarkSeen}
            title={`${unread} new submission${unread === 1 ? "" : "s"}`}
            aria-label={`${unread} new submissions`}
            className="flex h-6 min-w-6 items-center justify-center rounded-full bg-whatsapp px-1.5 text-[11px] font-bold leading-none text-white shadow-sm"
          >
            {unread > 99 ? "99+" : unread}
          </Link>
        )}
      </div>

      <Link
        href={`/dashboard/forms/${form.id}/edit`}
        className="block group"
      >
        <h3 className="mb-2 line-clamp-2 text-sm font-bold uppercase tracking-wide text-fg group-hover:text-whatsapp-deep dark:group-hover:text-whatsapp">
          {form.title}
        </h3>
      </Link>

      <div className="mb-3 flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-fg">
          {displayUrl}
        </span>
        <button
          type="button"
          onClick={onCopy}
          disabled={!isPublished}
          className={iconBtnClass}
          title={isPublished ? "Copy link" : "Publish form to copy link"}
          aria-label="Copy form link"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        {isPublished ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={iconBtnClass}
            title="Open form"
            aria-label="Open form in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className={cn(iconBtnClass, "opacity-40")} title="Publish to open">
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        )}
        <button
          type="button"
          onClick={onShare}
          disabled={!isPublished}
          className={cn(iconBtnClass, "sm:hidden")}
          title={isPublished ? "Share link" : "Publish form to share"}
          aria-label="Share form link"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <StatusPill status={form.status} />
          <span className="font-mono text-[11px] text-muted-fg tabular-nums">
            {responseCount} submission{responseCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            disabled={duplicating}
            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:opacity-50 touch-manipulation"
            title="Duplicate form"
            aria-label="Duplicate form"
          >
            {duplicating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Files className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-red-500/10 hover:text-red-600 touch-manipulation"
            title="Delete form"
            aria-label="Delete form"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/dashboard/forms/${form.id}/edit`}
            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg touch-manipulation"
            title="Edit form"
            aria-label="Edit form"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <p className="mt-2 font-mono text-[10px] text-muted-fg/80">
        Updated {formatDate(form.updated_at)}
      </p>
    </article>
  );
}
