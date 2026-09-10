/**
 * Public Direct Link page — /d/[slug]
 *
 * - Published links  → full redirect flow
 * - Draft links      → same page, but with a "Draft Preview" banner (no SEO indexing)
 * - Missing slug     → 404
 *
 * SEO metadata is generated server-side so bots see og: tags.
 * The actual WhatsApp redirect only fires in the client component (bots never run JS).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { DirectLink } from "@/lib/database.types";
import { DirectLinkRedirectView } from "@/components/direct-links/DirectLinkRedirectView";
import { Loader2 } from "lucide-react";

export const revalidate = 30;

type Props = { params: { slug: string } };

// Fetch the link regardless of status — we handle draft display below
async function getDirectLink(slug: string): Promise<DirectLink | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_links")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

// ── SEO Metadata (served to ALL requests, including bots) ─────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dl = await getDirectLink(params.slug);

  if (!dl) {
    return {
      title: "Link not found",
      robots: { index: false, follow: false },
    };
  }

  // Drafts: never index
  if (dl.status !== "published") {
    return {
      title: `${dl.name} (Draft)`,
      robots: { index: false, follow: false },
    };
  }

  const title       = dl.seo_title       || dl.name;
  const description = dl.seo_description || "Chat with us on WhatsApp.";
  const ogTitle     = dl.seo_og_title    || title;
  const ogDesc      = dl.seo_og_description || description;
  const canonical   = dl.canonical_url   || `${process.env.NEXT_PUBLIC_APP_URL}/d/${dl.slug}`;
  const robots      = dl.seo_indexing === "noindex" ? "noindex, nofollow" : "index, follow";

  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      type: "website",
      ...(dl.seo_og_image ? { images: [{ url: dl.seo_og_image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      ...(dl.seo_og_image ? { images: [dl.seo_og_image] } : {}),
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────
export default async function DirectLinkPage({ params }: Props) {
  const dl = await getDirectLink(params.slug);

  if (!dl) notFound();

  const isDraft = dl.status !== "published";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Draft banner — only visible when link is not published */}
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
