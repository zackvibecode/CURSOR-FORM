import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

// GET  /api/direct-links  — list all direct links for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("direct_links")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ direct_links: data ?? [] });
}

// POST /api/direct-links  — create a new direct link
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string } = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  const rawName = body.name?.trim() || "Untitled Direct Link";
  const baseSlug = slugify(rawName) || "direct-link";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: dl, error } = await supabase
    .from("direct_links")
    .insert({
      user_id: user.id,
      name: rawName,
      slug,
      status: "draft",
      distribution_mode: "single",
    })
    .select()
    .single();

  if (error || !dl) {
    return NextResponse.json({ error: error?.message ?? "Failed to create" }, { status: 500 });
  }

  return NextResponse.json({ direct_link: dl }, { status: 201 });
}
