"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { MessageCircle, LogOut, Plus, Loader2 } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-whatsapp text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
          WhatsLead
        </Link>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden text-sm text-gray-600 sm:block">
              Hi, {userName.split(" ")[0]}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

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

    setLoading(true);

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
          Creating...
        </>
      ) : (
        children ?? (
          <>
            <Plus className="h-4 w-4" />
            Create new form
          </>
        )
      )}
    </Button>
  );
}
