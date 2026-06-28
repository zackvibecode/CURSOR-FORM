"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card font-mono text-sm text-muted-fg">
        !
      </div>
      <h2 className="mb-2 text-base font-semibold text-fg">Something went wrong</h2>
      <p className="mb-6 max-w-md text-sm text-muted-fg">
        We could not load this page. Please try again or return to your dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
