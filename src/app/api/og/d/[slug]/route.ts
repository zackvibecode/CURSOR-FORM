/**
 * Proxy + compress OG images through our domain.
 *
 * Why this exists:
 * 1. Supabase Storage sends `x-robots-tag: none` — WhatsApp/Facebook often reject those URLs.
 * 2. Large PNGs (~2MB+) cause WhatsApp to fall back to the site favicon/logo.
 *
 * This route fetches the uploaded image, resizes to 1000×1000 JPEG (~150–300KB),
 * and serves it from form.zaqone.com so WhatsApp can scrape it reliably.
 */

import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/auth/urls";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const SIZE = 1000;

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

async function loadFallbackJpeg(): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "public", "favicon-icon.png");
  const png = await readFile(filePath);
  return sharp(png)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function toOgJpeg(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate() // honour EXIF orientation
    .resize(SIZE, SIZE, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = params;
  const source = await getOgSource(slug);

  try {
    let jpeg: Buffer;

    if (source) {
      const upstream = await fetch(source, {
        headers: { Accept: "image/*" },
        cache: "no-store",
      });
      if (!upstream.ok) {
        jpeg = await loadFallbackJpeg();
      } else {
        const bytes = Buffer.from(await upstream.arrayBuffer());
        jpeg = await toOgJpeg(bytes);
      }
    } else {
      jpeg = await loadFallbackJpeg();
    }

    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.byteLength),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "all",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[og-proxy]", slug, err);
    try {
      const jpeg = await loadFallbackJpeg();
      return new NextResponse(new Uint8Array(jpeg), {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=300",
          "X-Robots-Tag": "all",
        },
      });
    } catch {
      return NextResponse.redirect(`${getAppUrl()}/favicon-icon.png`, 302);
    }
  }
}
