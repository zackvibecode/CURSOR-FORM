"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, X, Info } from "lucide-react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toasts: ToastItem[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function toast(message: string, type: ToastType = "success") {
  const id = Date.now().toString();
  toasts = [...toasts, { id, message, type }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

const accentBar: Record<ToastType, string> = {
  success: "bg-whatsapp",
  error: "bg-red-500",
  info: "bg-blue-500",
};

const typeIcon: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastContainer() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    listeners.push(() => forceUpdate({}));
    return () => {
      listeners = listeners.filter((fn) => fn !== forceUpdate);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = typeIcon[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-3 overflow-hidden rounded-md border border-border bg-card py-2.5 pl-3 pr-4 text-sm shadow-md"
            >
              <span className={accentBar[t.type] + " h-5 w-0.5 shrink-0 rounded-full"} />
              <Icon className="h-4 w-4 shrink-0 text-muted-fg" />
              <span className="font-medium text-fg">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-1 shrink-0 rounded p-0.5 text-muted-fg transition-colors hover:text-fg"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
