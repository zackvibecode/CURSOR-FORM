"use client";

import { useEffect, useRef } from "react";
import { META_EVENTS, trackMetaEvent } from "@/lib/meta-pixel";

interface MetaViewContentProps {
  formId: string;
  formTitle: string;
  contentCategory: string;
  /** Tenant pixel — scopes ViewContent to the owner's data source only. */
  pixelId?: string;
}

/**
 * Fires the Meta `ViewContent` event once when a visitor opens a published
 * form page. The ref guard ensures it never re-fires on re-renders or React
 * Strict Mode double effects.
 */
export function MetaViewContent({
  formId,
  formTitle,
  contentCategory,
  pixelId,
}: MetaViewContentProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    trackMetaEvent(
      META_EVENTS.viewContent,
      {
        content_name: formTitle,
        content_category: contentCategory,
        content_ids: [formId],
        content_type: "form",
      },
      undefined,
      pixelId
    );
  }, [formId, formTitle, contentCategory, pixelId]);

  return null;
}
