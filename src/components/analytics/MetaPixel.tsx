"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ensureMetaFbcFromFbclid } from "@/lib/meta/attribution";
import { trackPageView } from "@/lib/meta/track";

interface MetaPixelProps {
  pixelId: string;
}

declare global {
  interface Window {
    __META_PIXEL_INITIALIZED__?: string;
    __META_PIXEL_LAST_PATH__?: string;
  }
}

/**
 * Meta Pixel loader — loads ONCE per pixel ID.
 * Initial PageView fires from the base snippet; SPA navigations fire via route watcher.
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  if (!pixelId) return null;

  // Escape for safe embedding inside the inline script string.
  const safeId = pixelId.replace(/[^0-9]/g, "");
  if (!safeId) return null;

  return (
    <>
      <Script
        id={`meta-pixel-${safeId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (window.__META_PIXEL_INITIALIZED__ === '${safeId}') return;
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${safeId}');
              window.__META_PIXEL_INITIALIZED__ = '${safeId}';
              fbq('track', 'PageView');
              window.__META_PIXEL_LAST_PATH__ = location.pathname + location.search;
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
        <MetaPixelRouteTracker />
      </Suspense>
    </>
  );
}

/**
 * Fires PageView on client-side route changes only (not the initial load).
 * Dedupes against the path recorded by the base snippet.
 */
function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    ensureMetaFbcFromFbclid();
  }, []);

  useEffect(() => {
    const path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    if (isFirst.current) {
      isFirst.current = false;
      if (typeof window !== "undefined" && !window.__META_PIXEL_LAST_PATH__) {
        window.__META_PIXEL_LAST_PATH__ = path;
      }
      return;
    }

    if (typeof window !== "undefined" && window.__META_PIXEL_LAST_PATH__ === path) {
      return;
    }

    if (typeof window !== "undefined") {
      window.__META_PIXEL_LAST_PATH__ = path;
    }

    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
