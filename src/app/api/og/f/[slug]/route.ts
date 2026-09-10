/**
 * Proxy + compress form OG images through our domain for WhatsApp/Facebook.
 * Same pattern as /api/og/d/[slug] — avoids Supabase x-robots-tag: none + large PNGs.
 */

import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/auth/urls";
import { getFormSeoFromForm } from "@/lib/form-settings";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const SIZE = 1000;

async function getFormOgSource(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("forms")
      .select("settings")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return null;
    return getFormSeoFromForm(data).seo_og_image || null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("forms")
    .select("settings")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return getFormSeoFromForm(data).seo_og_image || null;
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
    .rotate()
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export async function GET(_request: Request, { params }: Params) {
  const { slug } = params;
  const source = await getFormOgSource(slug);

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
        jpeg = await toOgJpeg(Buffer.from(await upstream.arrayBuffer()));
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
    console.error("[og-proxy-form]", slug, err);
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
