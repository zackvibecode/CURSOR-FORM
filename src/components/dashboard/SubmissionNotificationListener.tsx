"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import { useSubmissionNotifications } from "./SubmissionNotificationContext";

interface SubmissionNotificationListenerProps {
  userId: string;
}

export function SubmissionNotificationListener({
  userId,
}: SubmissionNotificationListenerProps) {
  const { addNotification } = useSubmissionNotifications();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setEnabled(data.settings?.submission_alerts ?? true);
        }
      } catch {
        // Ignore — dashboard still works without realtime alerts.
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`submission-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
        },
        async (payload) => {
          const formId = (payload.new as { form_id?: string }).form_id;
          if (!formId) return;

          const { data: form } = await supabase
            .from("forms")
            .select("title")
            .eq("id", formId)
            .eq("user_id", userId)
            .maybeSingle();

          if (!form) return;

          addNotification({
            formId,
            formTitle: form.title,
          });
          toast(`New lead — ${form.title}`, "success");
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, addNotification]);

  return null;
}
