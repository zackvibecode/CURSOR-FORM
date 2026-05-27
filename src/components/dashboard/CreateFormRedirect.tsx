"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CreateFormRedirect({ templateId }: { templateId: string }) {
  const router = useRouter();

  useEffect(() => {
    async function create() {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (data.form) {
        router.replace(`/dashboard/forms/${data.form.id}/edit`);
      } else {
        router.replace("/dashboard");
      }
    }
    create();
  }, [templateId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">Creating your form...</p>
    </div>
  );
}
