"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ensureMetaFbcFromFbclid } from "@/lib/meta/attribution";
import { trackPageView } from "@/lib/meta/track";

interface MetaPixelProps {
  pixelId: string;
}

const SITE_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

declare global {
  interface Window {
    /** Pixel IDs already initialised on this page load. */
    __META_PIXELS_INITIALIZED__?: string[];
    /** Last tracked path per pixel ID (guards duplicate SPA PageView). */
    __META_PIXEL_LAST_PATHS__?: Record<string, string>;
  }
}

/**
 * Meta Pixel loader — initialises each pixel ID exactly once and fires the
 * initial PageView to THAT pixel only (`fbq('trackSingle', ...)`).
 *
 * A site-wide pixel (NEXT_PUBLIC_META_PIXEL_ID) and a form owner's pixel can
 * both be initialised on the same page. A plain `fbq('track', 'PageView')`
 * would then hit both data sources, duplicating PageView for one of them.
 * SPA navigations fire via the route watcher below.
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  if (!pixelId) return null;

  // Escape for safe embedding inside the inline script string.
  const safeId = pixelId.replace(/[^0-9]/g, "");
  if (!safeId) return null;

  // The site-level pixel (SiteMetaPixel in the root layout) already loads this
  // exact ID with its own route watcher. Rendering a second loader would add a
  // duplicate script tag / noscript hit for the same data source.
  const siteId = SITE_PIXEL_ID?.replace(/[^0-9]/g, "");
  if (siteId && siteId === safeId) return null;

  return (
    <>
      <Script
        id={`meta-pixel-${safeId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var id = '${safeId}';
              var initialized = window.__META_PIXELS_INITIALIZED__ || (window.__META_PIXELS_INITIALIZED__ = []);
              if (initialized.indexOf(id) !== -1) return;
              initialized.push(id);
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', id);
              var paths = window.__META_PIXEL_LAST_PATHS__ || (window.__META_PIXEL_LAST_PATHS__ = {});
              paths[id] = location.pathname + location.search;
              fbq('trackSingle', id, 'PageView');
            })();
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${safeId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelRouteTracker pixelId={safeId} />
      </Suspense>
    </>
  );
}

/**
 * Fires PageView on client-side route changes for THIS pixel only.
 * The initial PageView comes from the base snippet; both write the same
 * per-pixel last-path registry so neither can double-fire.
 */
function MetaPixelRouteTracker({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    ensureMetaFbcFromFbclid();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    const paths =
      window.__META_PIXEL_LAST_PATHS__ || (window.__META_PIXEL_LAST_PATHS__ = {});

    const isFirstForPixel = paths[pixelId] === undefined;
    if (paths[pixelId] === path) return;
    paths[pixelId] = path;

    // Initial PageView is fired by the base snippet for this pixel.
    if (isFirstForPixel) return;

    trackPageView(undefined, pixelId);
  }, [pathname, searchParams, pixelId]);

  return null;
}
