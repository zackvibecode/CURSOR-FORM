/**
 * Proxy OG images through our own domain.
 *
 * WhatsApp / Facebook often reject Supabase Storage URLs because they send
 * `x-robots-tag: none`. Serving the image from form.zaqone.com fixes previews.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/auth/urls";

export const runtime = "nodejs";
export const revalidate = 3600;

type Params = { params: { slug: string } };

async function getOgSource(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("direct_links")
      .select("seo_og_image")
      .eq("slug", slug)
      .maybeSingle();
    return (data?.seo_og_image as string | null) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("direct_links")
    .select("seo_og_image")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data?.seo_og_image ?? null;
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = params;
  const appUrl = getAppUrl();
  const fallback = `${appUrl}/favicon-icon.png`;

  const source = (await getOgSource(slug)) || fallback;

  try {
    const upstream = await fetch(source, {
      headers: { Accept: "image/*" },
      // Revalidate periodically; WhatsApp scrapes once and caches hard
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.redirect(fallback, 302);
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(bytes.byteLength),
        // Explicitly allow crawlers to use this image
        "X-Robots-Tag": "all",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.redirect(fallback, 302);
  }
}
