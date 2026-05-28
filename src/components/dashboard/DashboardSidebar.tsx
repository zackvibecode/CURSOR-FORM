"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Users,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/submissions", label: "Submissions", icon: Inbox },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (href === "/dashboard/forms") {
      return pathname.startsWith("/dashboard/forms");
    }
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-border bg-white transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-brand-border px-5">
          <BrandLogo />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-muted hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-whatsapp/10 text-whatsapp-deep"
                    : "text-brand-muted hover:bg-gray-50 hover:text-brand-text"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-brand-border p-4">
          <p className="text-xs text-brand-muted">OneForm</p>
          <p className="text-xs font-medium text-whatsapp-deep">oneform.app</p>
        </div>
      </aside>
    </>
  );
}
