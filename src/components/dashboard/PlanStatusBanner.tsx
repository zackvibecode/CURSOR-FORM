"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Crown, Timer, X } from "lucide-react";

interface PlanStatusBannerProps {
  plan: string;
  status: string;
  expiresAt?: string | null;
}

function daysLeftUntil(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export function PlanStatusBanner({ plan, status, expiresAt }: PlanStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const daysLeft = daysLeftUntil(expiresAt);
  const paid = plan !== "free";
  const expiringSoon = paid && daysLeft !== null && daysLeft <= 7;
  const expired = paid && daysLeft !== null && daysLeft < 0;

  if (dismissed) return null;

  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  if (status === "pending") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your <span className="font-semibold">{PLAN_LABELS[plan] ?? plan}</span> plan is pending
            approval. We&apos;ll activate it shortly.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (expiringSoon) {
    const urgent = daysLeft !== null && daysLeft < 0;
    const warning = daysLeft !== null && daysLeft <= 3 && !urgent;
    return (
      <div
        className={`mb-6 flex items-center justify-between gap-4 rounded-md border px-4 py-2.5 ${
          urgent
            ? "border-red-500/30 bg-red-500/5"
            : warning
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border bg-card"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {urgent ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <Timer className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <p
            className={`truncate text-sm ${
              urgent ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"
            }`}
          >
            {urgent ? (
              <>
                <span className="font-semibold">{PLAN_LABELS[plan] ?? plan}</span> plan expired on{" "}
                {expiryDate}. Renew to keep your features.
              </>
            ) : (
              <>
                <span className="font-semibold">{PLAN_LABELS[plan] ?? plan}</span> plan expires in{" "}
                <span className="font-semibold">
                  {daysLeft} day{daysLeft === 1 ? "" : "s"}
                </span>{" "}
                ({expiryDate}).
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/dashboard/admin/payments"
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              urgent
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
            }`}
          >
            Top Up
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className={`rounded-md p-1 transition-colors hover:bg-muted ${
              urgent ? "text-red-600 dark:text-red-400" : "text-muted-fg hover:text-fg"
            }`}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (plan === "free" && status === "active") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
          <p className="text-sm text-muted-fg">
            You&apos;re on the Free plan.{" "}
            <Link
              href="/dashboard/admin/payments"
              className="font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
            >
              Upgrade to Pro
            </Link>{" "}
            for unlimited forms.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
