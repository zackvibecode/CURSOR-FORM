"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface SubmissionNotificationContextValue {
  unreadCount: number;
  clearUnread: () => void;
  incrementUnread: () => void;
}

const SubmissionNotificationContext = createContext<SubmissionNotificationContextValue>({
  unreadCount: 0,
  clearUnread: () => {},
  incrementUnread: () => {},
});

export function SubmissionNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({ unreadCount, clearUnread, incrementUnread }),
    [unreadCount, clearUnread, incrementUnread]
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
