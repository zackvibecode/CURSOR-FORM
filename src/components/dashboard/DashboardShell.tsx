"use client";

import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { SubmissionNotificationProvider } from "./SubmissionNotificationContext";
import { SubmissionNotificationListener } from "./SubmissionNotificationListener";

interface DashboardShellProps {
  children: React.ReactNode;
  userId: string;
  userName?: string | null;
  plan?: string;
  status?: string;
  formsCount?: number;
  isAdmin?: boolean;
}

export function DashboardShell({
  children,
  userId,
  userName,
  plan = "free",
  status = "active",
  formsCount = 0,
  isAdmin = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SubmissionNotificationProvider>
      <SubmissionNotificationListener userId={userId} />
      <div className="flex min-h-screen bg-bg">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        plan={plan}
        status={status}
        formsCount={formsCount}
        isAdmin={isAdmin}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      </div>
    </SubmissionNotificationProvider>
  );
}
