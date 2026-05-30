"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LogOut, Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/forms": "Forms",
  "/dashboard/submissions": "Submissions",
  "/dashboard/customers": "Customers",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

interface DashboardTopBarProps {
  userName?: string | null;
  onMenuClick: () => void;
}

export function DashboardTopBar({ userName, onMenuClick }: DashboardTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === "/dashboard" ? pathname === path : pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-brand-muted hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-brand-text sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {userName && (
          <span className="hidden text-sm text-brand-muted md:block">
            {userName.split(" ")[0]}
          </span>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
