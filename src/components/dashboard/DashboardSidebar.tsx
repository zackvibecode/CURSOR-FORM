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
  Wrench,
  X,
  Crown,
  ShieldCheck,
} from "lucide-react";

const mainNavItems = [
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
  plan?: string;
  status?: string;
  formsCount?: number;
  isAdmin?: boolean;
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    pro: "bg-whatsapp/10 text-whatsapp-deep",
    business: "bg-purple-100 text-purple-700",
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            planColors[plan] ?? planColors.free
          )}
        >
          {plan !== "free" && <Crown className="h-3 w-3" />}
          {planLabels[plan] ?? "Free"}
        </span>
        {status === "pending" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardSidebar({
  open,
  onClose,
  plan = "free",
  status = "active",
  formsCount = 0,
  isAdmin = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (href === "/dashboard/forms") {
      return pathname.startsWith("/dashboard/forms");
    }
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const freeFormLimit = 3;

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
          {mainNavItems.map((item) => {
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

          {/* Divider before Tools */}
          <div className="my-2 border-t border-gray-100" />

          {/* Tools */}
          <Link
            href="/dashboard/tools"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive("/dashboard/tools")
                ? "bg-whatsapp/10 text-whatsapp-deep"
                : "text-brand-muted hover:bg-gray-50 hover:text-brand-text"
            )}
          >
            <Wrench className="h-5 w-5" strokeWidth={1.75} />
            Tools
          </Link>

          {isAdmin && (
            <>
              <div className="my-2 border-t border-gray-100" />
              <Link
                href="/dashboard/admin/subscriptions"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive("/dashboard/admin")
                    ? "bg-whatsapp/10 text-whatsapp-deep"
                    : "text-brand-muted hover:bg-gray-50 hover:text-brand-text"
                )}
              >
                <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                Admin
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-brand-border p-4">
          <PlanBadge plan={plan} status={status} />
          {plan === "free" && (
            <p className="mt-1 text-xs text-brand-muted">
              {formsCount}/{freeFormLimit} forms used
            </p>
          )}
          {status === "pending" && (
            <p className="mt-1 text-xs text-amber-600">Awaiting approval</p>
          )}
        </div>
      </aside>
    </>
  );
}