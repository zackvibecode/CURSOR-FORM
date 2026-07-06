"use client";

import { useEffect, useRef, useState } from "react";
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
  const lastSeenSubmissionId = useRef<string | null>(null);
  const knownSubmissionIds = useRef<Set<string>>(new Set());
  const pollingReady = useRef(false);

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

    async function seedKnownSubmissions() {
      const { data: forms } = await supabase.from("forms").select("id").eq("user_id", userId);
      const formIds = (forms ?? []).map((form) => form.id);
      if (formIds.length === 0) {
        pollingReady.current = true;
        return;
      }

      const { data: recent } = await supabase
        .from("submissions")
        .select("id, form_id, submitted_at")
        .in("form_id", formIds)
        .order("submitted_at", { ascending: false })
        .limit(25);

      (recent ?? []).forEach((row) => knownSubmissionIds.current.add(row.id));
      lastSeenSubmissionId.current = recent?.[0]?.id ?? null;
      pollingReady.current = true;
    }

    void seedKnownSubmissions();

    async function notifyForSubmission(formId: string, submissionId: string) {
      if (knownSubmissionIds.current.has(submissionId)) return;
      knownSubmissionIds.current.add(submissionId);
      lastSeenSubmissionId.current = submissionId;

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
          const submissionId = (payload.new as { id?: string }).id;
          const formId = (payload.new as { form_id?: string }).form_id;
          if (!formId || !submissionId) return;
          await notifyForSubmission(formId, submissionId);
        }
      )
      .subscribe();

    const pollInterval = window.setInterval(async () => {
      if (!pollingReady.current) return;

      const { data: forms } = await supabase.from("forms").select("id").eq("user_id", userId);
      const formIds = (forms ?? []).map((form) => form.id);
      if (formIds.length === 0) return;

      const { data: latest } = await supabase
        .from("submissions")
        .select("id, form_id, submitted_at")
        .in("form_id", formIds)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest || knownSubmissionIds.current.has(latest.id)) return;

      await notifyForSubmission(latest.form_id, latest.id);
    }, 8000);

    return () => {
      window.clearInterval(pollInterval);
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, addNotification]);

  return null;
}
