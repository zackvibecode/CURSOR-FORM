"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_EVENTS, captureFbclid, trackMetaEvent } from "@/lib/meta-pixel";

const SITE_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Routes that belong to the logged-in product — excluded from site analytics. */
const EXCLUDED_ROUTE_PREFIXES = ["/dashboard", "/login", "/signup", "/auth"];

function isExcludedRoute(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * App-level Meta Pixel for the marketing site, driven by
 * NEXT_PUBLIC_META_PIXEL_ID. Renders nothing when the env var is unset,
 * so production behaviour is unchanged until it is configured.
 *
 * The base code fires the initial PageView; the effect below fires PageView
 * on SPA route changes only (guarded against double-firing).
 */
export function SiteMetaPixel() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    captureFbclid();
  }, []);

  useEffect(() => {
    if (!SITE_PIXEL_ID) return;
    if (isExcludedRoute(pathname)) return;
    if (lastTrackedPathRef.current === pathname) return;

    const isFirstRender = lastTrackedPathRef.current === null;
    lastTrackedPathRef.current = pathname;
    if (isFirstRender) return; // initial PageView comes from the base code

    // Scoped to the site pixel: public form pages also initialise the form
    // owner's tenant pixel, and an unscoped track would reach BOTH pixels.
    trackMetaEvent(META_EVENTS.pageView, { page_path: pathname }, undefined, SITE_PIXEL_ID);
  }, [pathname]);

  if (!SITE_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel-site"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${SITE_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${SITE_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
