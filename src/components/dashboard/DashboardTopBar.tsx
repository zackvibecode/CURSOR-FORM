"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, Settings, Search, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Overview",
  forms: "Forms",
  submissions: "Submissions",
  customers: "Customers",
  analytics: "Analytics",
  settings: "Settings",
  tools: "Tools",
  admin: "Admin",
  "qr-generator": "QR Generator",
  "link-generator": "Link Generator",
  subscriptions: "Subscriptions",
  edit: "Edit",
};

interface DashboardTopBarProps {
  userName?: string | null;
  onMenuClick: () => void;
}

function buildCrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = SEGMENT_LABELS[seg] ?? seg;
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

export function DashboardTopBar({ userName, onMenuClick }: DashboardTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initial = userName?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {crumbs.length === 0 ? (
            <span className="font-medium text-fg">Overview</span>
          ) : (
            crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={c.href} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-fg/60" />
                  )}
                  {isLast ? (
                    <span className="font-medium text-fg">{c.label}</span>
                  ) : (
                    <span className="text-muted-fg">{c.label}</span>
                  )}
                </span>
              );
            })
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Search (decorative — filters handled client-side in lists) */}
        <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-muted-fg md:flex">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search…</span>
          <kbd className="ml-2 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-fg">
            /
          </kbd>
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-fg transition-colors hover:bg-muted",
              menuOpen && "ring-2 ring-whatsapp/30"
            )}
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-md border border-border bg-card py-1 shadow-md animate-slide-in">
              {userName && (
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-xs font-medium text-fg">{userName}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-fg transition-colors hover:bg-muted hover:text-fg"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-fg transition-colors hover:bg-muted hover:text-fg"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
