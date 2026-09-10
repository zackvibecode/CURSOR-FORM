/**
 * Public Direct Link page — /d/[slug]
 *
 * SEO / Open Graph metadata is generated server-side so WhatsApp, Facebook,
 * and other crawlers see og:title / og:description / og:image BEFORE any JS runs.
 * The WhatsApp redirect only happens client-side (bots never trigger team rotation).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/auth/urls";
import type { DirectLink } from "@/lib/database.types";
import { DirectLinkRedirectView } from "@/components/direct-links/DirectLinkRedirectView";
import { Loader2 } from "lucide-react";

export const revalidate = 0; // always fresh OG tags after SEO save

type Props = { params: { slug: string } };

const OG_SIZE = 1000;

function absoluteUrl(url: string | null | undefined, fallbackPath: string): string {
  const base = getAppUrl();
  if (!url || !url.trim()) return `${base}${fallbackPath}`;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${base}${url}`;
  return url;
}

async function getDirectLink(slug: string): Promise<DirectLink | null> {
  // Prefer service role so crawlers (no cookies) always get published rows
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("direct_links")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as DirectLink | null) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_links")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dl = await getDirectLink(params.slug);
  const appUrl = getAppUrl();

  if (!dl) {
    return {
      title: "Link not found",
      robots: { index: false, follow: false },
    };
  }

  const isDraft = dl.status !== "published";
  const title = dl.seo_og_title || dl.seo_title || dl.name;
  const description =
    dl.seo_og_description ||
    dl.seo_description ||
    "Chat with us on WhatsApp.";
  const pageUrl = dl.canonical_url || `${appUrl}/d/${dl.slug}`;

  // Custom upload → else site icon so WhatsApp always has an image to scrape
  const imageUrl = absoluteUrl(dl.seo_og_image, "/favicon-icon.png");
  const imageType = /\.jpe?g(\?|$)/i.test(imageUrl)
    ? "image/jpeg"
    : /\.webp(\?|$)/i.test(imageUrl)
      ? "image/webp"
      : /\.gif(\?|$)/i.test(imageUrl)
        ? "image/gif"
        : "image/png";

  return {
    metadataBase: new URL(appUrl),
    title: isDraft ? `${dl.name} (Draft)` : title,
    description,
    alternates: { canonical: pageUrl },
    robots: isDraft || dl.seo_indexing === "noindex"
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "OneForm",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: OG_SIZE,
          height: OG_SIZE,
          alt: title,
          type: imageType,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function DirectLinkPage({ params }: Props) {
  const dl = await getDirectLink(params.slug);

  if (!dl) notFound();

  const isDraft = dl.status !== "published";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {isDraft && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2.5 text-center text-xs font-semibold text-amber-900">
          <span>⚠</span>
          <span>
            Draft Preview — this link is not published yet. Only you can see this.
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#25D366]" />
            </div>
          }
        >
          <DirectLinkRedirectView
            slug={params.slug}
            name={dl.name}
            seoDescription={dl.seo_description}
            isDraft={isDraft}
          />
        </Suspense>
      </div>
    </div>
  );
}
