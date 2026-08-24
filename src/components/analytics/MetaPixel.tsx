"use client";

import Script from "next/script";
import { useEffect } from "react";
import { captureFbclid } from "@/lib/meta-pixel";

interface MetaPixelProps {
  pixelId: string;
}

const SITE_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Tenant Meta Pixel loader — mounted once per public form page (/[slug]).
 * Fires the initial PageView. SPA route changes are not applicable here:
 * form pages are standalone full page loads.
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    captureFbclid();
  }, []);

  if (!pixelId) return null;

  // The site-level pixel (SiteMetaPixel, root layout) already initialises this
  // ID — rendering a second loader would double-init the pixel and double-fire
  // PageView to the same data source.
  if (SITE_PIXEL_ID && SITE_PIXEL_ID === pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel-form"
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
            fbq('init', '${pixelId}');
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
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
