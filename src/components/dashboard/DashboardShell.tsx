"use client";

import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

interface DashboardShellProps {
  children: React.ReactNode;
  userName?: string | null;
  plan?: string;
  status?: string;
  formsCount?: number;
}

export function DashboardShell({
  children,
  userName,
  plan = "free",
  status = "active",
  formsCount = 0,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        plan={plan}
        status={status}
        formsCount={formsCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
