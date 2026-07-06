"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { setPendingInstant } from "@/lib/instant-pending";

export function CreateFormButton({
  templateId,
  children,
  className,
  onError,
}: {
  templateId?: string;
  children?: React.ReactNode;
  className?: string;
  onError?: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (loading) return;

    setPendingInstant(setLoading, true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      const data = await res.json();

      if (!res.ok || !data.form) {
        const message = data.error ?? "Failed to create form. Please try again.";
        onError?.(message);
        return;
      }

      router.push(`/dashboard/forms/${data.form.id}/edit`);
      router.refresh();
    } catch {
      onError?.("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCreate} className={className} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating…
        </>
      ) : (
        children ?? (
          <>
            <Plus className="h-4 w-4" />
            New form
          </>
        )
      )}
    </Button>
  );
}
