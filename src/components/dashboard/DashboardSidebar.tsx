"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
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
  const planDot: Record<string, string> = {
    free: "bg-gray-400",
    pro: "bg-whatsapp",
    business: "bg-purple-500",
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium",
          plan === "pro"
            ? "text-whatsapp-deep dark:text-whatsapp"
            : plan === "business"
            ? "text-purple-600 dark:text-purple-400"
            : "text-muted-fg"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", planDot[plan] ?? planDot.free)} />
        {planLabels[plan] ?? "Free"}
      </span>
      {status === "pending" && (
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Pending
        </span>
      )}
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
    if (href === "/dashboard/tools") {
      return pathname.startsWith("/dashboard/tools");
    }
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const freeFormLimit = 3;
  const usagePct = plan === "free" ? Math.min((formsCount / freeFormLimit) * 100, 100) : 0;

  const renderNavLink = (item: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }) => {
    const active = isActive(item.href, item.exact);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          active
            ? "bg-muted text-fg"
            : "text-muted-fg hover:bg-muted/60 hover:text-fg"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-whatsapp" />
        )}
        <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header / Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <BrandLogo size="sm" />
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
            Workspace
          </p>
          <div className="space-y-0.5">{mainNavItems.map(renderNavLink)}</div>

          <p className="mb-1.5 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
            Tools
          </p>
          <div className="space-y-0.5">
            {renderNavLink({ href: "/dashboard/tools", label: "Tools", icon: Wrench })}
          </div>

          {isAdmin && (
            <>
              <p className="mb-1.5 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
                Admin
              </p>
              <div className="space-y-0.5">
                {renderNavLink({
                  href: "/dashboard/admin/subscriptions",
                  label: "Subscriptions",
                  icon: ShieldCheck,
                })}
              </div>
            </>
          )}
        </nav>

        {/* Footer: Plan + Theme */}
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <PlanBadge plan={plan} status={status} />
            <ThemeToggle />
          </div>
          {plan === "free" && (
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-muted-fg">
                <span>
                  {formsCount}/{freeFormLimit} forms
                </span>
                <Link
                  href="/pricing"
                  className="font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
                >
                  Upgrade
                </Link>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-whatsapp transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          )}
          {status === "pending" && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Awaiting approval
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
