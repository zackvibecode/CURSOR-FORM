"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Inbox, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmissionNotifications } from "./SubmissionNotificationContext";

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SubmissionNotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const {
    unreadCount,
    notifications,
    soundEnabled,
    bellRinging,
    clearUnread,
    setSoundEnabled,
    playBell,
  } = useSubmissionNotifications();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleOpen = () => {
    setOpen((value) => !value);
    if (!open) {
      clearUnread();
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-fg transition-colors hover:bg-muted hover:text-fg",
          open && "ring-2 ring-whatsapp/30 text-fg",
          bellRinging && "animate-pulse text-whatsapp"
        )}
        aria-label="Submission notifications"
        aria-expanded={open}
      >
        <Bell className={cn("h-4 w-4", bellRinging && "animate-bounce")} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-whatsapp px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-slide-in">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-fg">Notifications</p>
              <p className="text-[11px] text-muted-fg">New form submissions</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playBell();
                }}
                className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg"
                aria-label={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                title={soundEnabled ? "Mute bell sound" : "Enable bell sound"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <BellOff className="h-8 w-8 text-muted-fg/50" />
                <p className="text-sm text-muted-fg">No new submissions yet</p>
                <p className="text-[11px] text-muted-fg">
                  Bell will ring when someone submits your form
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    clearUnread();
                    router.push("/dashboard/submissions");
                  }}
                  className="flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp">
                    <Inbox className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      New lead — {item.formTitle}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-fg">
                      {formatTime(item.receivedAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-3 py-2">
            <Link
              href="/dashboard/submissions"
              onClick={() => {
                setOpen(false);
                clearUnread();
              }}
              className="block rounded-md px-2 py-1.5 text-center text-xs font-medium text-whatsapp-deep transition-colors hover:bg-whatsapp/5 dark:text-whatsapp"
            >
              View all submissions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
