"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateFormRedirect({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function create() {
      try {
        const res = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        const data = await res.json();
        if (data.form) {
          router.replace(`/dashboard/forms/${data.form.id}/edit`);
        } else {
          setError(data.error ?? "Failed to create form.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
    create();
  }, [templateId, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-brand-red">{error}</p>
        <button
          onClick={() => router.replace("/dashboard")}
          className="text-sm font-semibold text-whatsapp hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Creating your form...</p>
    </div>
  );
}
