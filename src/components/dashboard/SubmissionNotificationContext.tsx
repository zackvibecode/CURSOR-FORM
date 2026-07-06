"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  isNotificationAudioUnlocked,
  playNotificationBell,
  unlockNotificationAudio,
} from "@/lib/notification-sound";

export interface SubmissionNotificationItem {
  id: string;
  formId: string;
  formTitle: string;
  receivedAt: string;
}

interface SubmissionNotificationContextValue {
  unreadCount: number;
  notifications: SubmissionNotificationItem[];
  soundEnabled: boolean;
  bellRinging: boolean;
  clearUnread: () => void;
  incrementUnread: () => void;
  addNotification: (item: Omit<SubmissionNotificationItem, "id" | "receivedAt">) => void;
  setSoundEnabled: (enabled: boolean) => void;
  playBell: () => void;
}

const SubmissionNotificationContext = createContext<SubmissionNotificationContextValue>({
  unreadCount: 0,
  notifications: [],
  soundEnabled: true,
  bellRinging: false,
  clearUnread: () => {},
  incrementUnread: () => {},
  addNotification: () => {},
  setSoundEnabled: () => {},
  playBell: () => {},
});

const SOUND_PREF_KEY = "oneform-notification-sound";
const MAX_NOTIFICATIONS = 20;

export function SubmissionNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SubmissionNotificationItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [bellRinging, setBellRinging] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    if (stored !== null) {
      setSoundEnabledState(stored === "true");
    }

    const unlock = () => unlockNotificationAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
    if (enabled) {
      unlockNotificationAudio();
    }
  }, []);

  const playBell = useCallback(() => {
    playNotificationBell();
    setBellRinging(true);
    window.setTimeout(() => setBellRinging(false), 700);
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((count) => count + 1);
  }, []);

  const addNotification = useCallback(
    (item: Omit<SubmissionNotificationItem, "id" | "receivedAt">) => {
      const entry: SubmissionNotificationItem = {
        ...item,
        id: crypto.randomUUID(),
        receivedAt: new Date().toISOString(),
      };

      setNotifications((prev) => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((count) => count + 1);

      if (soundEnabled) {
        if (!isNotificationAudioUnlocked()) {
          unlockNotificationAudio();
        }
        playBell();
      } else {
        setBellRinging(true);
        window.setTimeout(() => setBellRinging(false), 700);
      }
    },
    [playBell, soundEnabled]
  );

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      soundEnabled,
      bellRinging,
      clearUnread,
      incrementUnread,
      addNotification,
      setSoundEnabled,
      playBell,
    }),
    [
      unreadCount,
      notifications,
      soundEnabled,
      bellRinging,
      clearUnread,
      incrementUnread,
      addNotification,
      setSoundEnabled,
      playBell,
    ]
  );

  return (
    <SubmissionNotificationContext.Provider value={value}>
      {children}
    </SubmissionNotificationContext.Provider>
  );
}

export function useSubmissionNotifications() {
  return useContext(SubmissionNotificationContext);
}
