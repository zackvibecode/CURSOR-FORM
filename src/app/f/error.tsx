"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PublicFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public-form]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 text-center">
      <h2 className="mb-2 text-xl font-bold text-brand-text">Form unavailable</h2>
      <p className="mb-6 max-w-md text-sm text-brand-muted">
        This form could not be loaded right now. Please try again in a moment.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
