"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/meta/track";
import type { MetaEventParams } from "@/lib/meta/types";

/**
 * Fires ViewContent once when the component mounts for a given content key.
 * Guards against React re-renders / remounts within the same tab session.
 */
export function MetaViewContent({
  contentKey,
  contentName,
  contentCategory,
  contentIds,
  contentType = "form",
}: {
  contentKey: string;
  contentName: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (typeof window === "undefined") return;

    const storageKey = `meta_vc_${contentKey}`;
    try {
      if (sessionStorage.getItem(storageKey) === "1") {
        firedRef.current = true;
        return;
      }
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage may be blocked — fall through with ref guard only.
    }

    firedRef.current = true;

    const params: MetaEventParams = {
      content_name: contentName,
      content_type: contentType,
      ...(contentCategory ? { content_category: contentCategory } : {}),
      ...(contentIds?.length ? { content_ids: contentIds } : {}),
    };

    trackViewContent(params);
  }, [contentKey, contentName, contentCategory, contentIds, contentType]);

  return null;
}
