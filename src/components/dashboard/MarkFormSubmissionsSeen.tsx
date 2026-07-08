"use client";

import { useEffect } from "react";
import { markAllFormSubmissionsSeen } from "@/lib/form-seen";

interface MarkFormSubmissionsSeenProps {
  forms: Array<{ id: string; count: number }>;
}

/** Clears per-form green unread badges when the Submissions page is opened. */
export function MarkFormSubmissionsSeen({ forms }: MarkFormSubmissionsSeenProps) {
  useEffect(() => {
    if (forms.length === 0) return;
    markAllFormSubmissionsSeen(forms);
  }, [forms]);

  return null;
}
