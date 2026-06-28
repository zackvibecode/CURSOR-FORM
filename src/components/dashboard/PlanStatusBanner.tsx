"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, X } from "lucide-react";

interface PlanStatusBannerProps {
  plan: string;
  status: string;
}

export function PlanStatusBanner({ plan, status }: PlanStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const planLabels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };

  if (status === "pending") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your <span className="font-semibold">{planLabels[plan] ?? plan}</span> plan is pending
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

  if (plan === "free" && status === "active") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
          <p className="text-sm text-muted-fg">
            You&apos;re on the Free plan.{" "}
            <Link
              href="/pricing"
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
