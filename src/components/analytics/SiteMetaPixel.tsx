"use client";

import { Suspense } from "react";
import { MetaPixel } from "@/components/analytics/MetaPixel";

/**
 * Optional site-wide Meta Pixel for marketing pages (landing, pricing, demo).
 * Uses NEXT_PUBLIC_META_PIXEL_ID — separate from per-owner form pixels.
 */
export function SiteMetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!pixelId) return null;

  return (
    <Suspense fallback={null}>
      <MetaPixel pixelId={pixelId} />
    </Suspense>
  );
}
