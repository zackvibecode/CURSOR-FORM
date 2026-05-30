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

  // Pending approval banner takes priority
  if (status === "pending") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Your <span className="font-semibold">{planLabels[plan] ?? plan}</span> plan is pending
            approval. We&apos;ll activate it shortly.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-amber-600 hover:bg-amber-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Subtle upgrade prompt for free plan
  if (plan === "free" && status === "active") {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-whatsapp/20 bg-whatsapp/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 shrink-0 text-whatsapp-deep" />
          <p className="text-sm text-brand-text">
            You&apos;re on the Free plan.{" "}
            <Link href="/pricing" className="font-semibold text-whatsapp-deep hover:underline">
              Upgrade to Pro
            </Link>{" "}
            for unlimited forms.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-whatsapp-deep hover:bg-whatsapp/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}