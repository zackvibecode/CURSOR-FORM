"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  getExistingPushSubscription,
  isIosDevice,
  isPushApiSupported,
  isStandalonePwa,
  registerPushServiceWorker,
  subscribeToPush,
  subscriptionToJSON,
  unsubscribeFromPush,
} from "@/lib/push/client";

type UiStatus = "loading" | "unsupported" | "ios_install" | "denied" | "disabled" | "enabled";

export function PushNotificationSettings() {
  const [status, setStatus] = useState<UiStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [deviceCount, setDeviceCount] = useState(0);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (!isPushApiSupported()) {
        if (isIosDevice() && !isStandalonePwa()) {
          setStatus("ios_install");
        } else {
          setStatus("unsupported");
        }
        setConfigured(true);
        return;
      }

      if (isIosDevice() && !isStandalonePwa()) {
        setStatus("ios_install");
      }

      const [statusRes, localSub] = await Promise.all([
        fetch("/api/push/status").then((r) => (r.ok ? r.json() : null)),
        getExistingPushSubscription(),
      ]);

      const key =
        statusRes?.publicKey ||
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        null;
      setVapidPublicKey(key);
      setConfigured(Boolean(statusRes?.configured && key));
      setDeviceCount(Array.isArray(statusRes?.subscriptions) ? statusRes.subscriptions.length : 0);

      if (isIosDevice() && !isStandalonePwa()) {
        setStatus("ios_install");
        return;
      }

      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      if (localSub) {
        setStatus("enabled");
      } else {
        setStatus("disabled");
      }
    } catch {
      setStatus("disabled");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      if (!isPushApiSupported()) {
        toast("Push notifications are not supported on this browser.", "error");
        return;
      }

      if (isIosDevice() && !isStandalonePwa()) {
        toast("Install OneForm to your Home Screen first, then enable notifications.", "error");
        setStatus("ios_install");
        return;
      }

      let publicKey = vapidPublicKey;
      if (!publicKey) {
        const res = await fetch("/api/push/subscribe");
        const data = await res.json().catch(() => ({}));
        publicKey = data.publicKey ?? null;
        setVapidPublicKey(publicKey);
        setConfigured(Boolean(data.configured && publicKey));
      }

      if (!publicKey) {
        toast("Web Push is not configured yet. Add VAPID keys on the server.", "error");
        return;
      }

      await registerPushServiceWorker();
      const subscription = await subscribeToPush(publicKey);
      if (!subscription) {
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          setStatus("denied");
          toast("Notification permission denied. Enable it in browser settings.", "error");
        } else {
          toast("Could not enable notifications.", "error");
        }
        return;
      }

      const payload = subscriptionToJSON(subscription);
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          device_name: guessDeviceName(),
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        toast(saveData.error ?? "Failed to save subscription", "error");
        return;
      }

      toast("Notifications enabled on this device", "success");
      await refresh();
    } catch (error) {
      console.error("[push] enable failed", error);
      toast("Failed to enable notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      toast("Notifications disabled on this device", "success");
      await refresh();
    } catch {
      toast("Failed to disable notifications", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "Test failed", "error");
        return;
      }
      toast("Test notification sent", "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setBusy(false);
    }
  };

  const statusLabel =
    status === "loading"
      ? "Checking…"
      : status === "enabled"
        ? "Enabled"
        : status === "denied"
          ? "Blocked"
          : status === "unsupported"
            ? "Unsupported"
            : status === "ios_install"
              ? "Install required"
              : "Disabled";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-whatsapp/15 text-whatsapp-deep dark:text-whatsapp">
          <Bell className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-fg">5. Browser / PWA push</p>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-fg">
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-fg">
            Alert terus ke telefon staff bila customer submit form — walaupun app tertutup.
            Hanya untuk akaun login (Settings), bukan visitor form awam.
          </p>

          {!configured && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Server belum ada VAPID keys. Tambah{" "}
              <span className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</span>,{" "}
              <span className="font-mono">VAPID_PRIVATE_KEY</span>, dan{" "}
              <span className="font-mono">VAPID_SUBJECT</span> dalam Vercel env.
            </p>
          )}

          {status === "ios_install" && (
            <div className="mt-3 rounded-md border border-border bg-card p-3 text-xs text-muted-fg">
              <p className="flex items-start gap-2 font-medium text-fg">
                <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                iPhone: install ke Home Screen dulu
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Buka OneForm dalam Safari</li>
                <li>Tap Share → Add to Home Screen</li>
                <li>Buka app dari ikon Home Screen</li>
                <li>Kembali ke Settings dan tekan Enable Notifications</li>
              </ol>
            </div>
          )}

          {status === "denied" && (
            <p className="mt-2 text-xs text-muted-fg">
              Permission diblok. Buka browser site settings dan benarkan Notifications untuk
              domain ini, kemudian cuba semula.
            </p>
          )}

          {deviceCount > 0 && (
            <p className="mt-2 text-[11px] text-muted-fg">
              Active devices on this account: {deviceCount}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {status !== "enabled" && status !== "loading" && status !== "unsupported" && (
              <Button
                type="button"
                size="sm"
                disabled={busy || status === "denied" || status === "ios_install" || !configured}
                onClick={() => void handleEnable()}
              >
                {busy ? "Enabling…" : "Enable Notifications"}
              </Button>
            )}

            {status === "enabled" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void handleTest()}
                >
                  Send test
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void handleDisable()}
                >
                  <BellOff className="mr-1.5 h-3.5 w-3.5" />
                  Disable Notifications
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function guessDeviceName() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac/i.test(ua)) return "Mac";
  return "Browser";
}
