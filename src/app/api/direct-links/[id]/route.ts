import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

type Params = { params: { id: string } };

// GET /api/direct-links/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dl, error } = await supabase
    .from("direct_links")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!dl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Also fetch team members
  const { data: members } = await supabase
    .from("direct_link_team_members")
    .select("*")
    .eq("direct_link_id", id)
    .order("position", { ascending: true });

  return NextResponse.json({ direct_link: dl, team_members: members ?? [] });
}

// PUT /api/direct-links/[id]
export async function PUT(request: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: existing } = await supabase
    .from("direct_links")
    .select("id, slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Slug processing
  let slug = existing.slug;
  if (typeof body.slug === "string" && body.slug.trim()) {
    const candidate = slugify(body.slug.trim());
    if (candidate !== existing.slug) {
      // Check uniqueness
      const { data: clash } = await supabase
        .from("direct_links")
        .select("id")
        .eq("slug", candidate)
        .neq("id", id)
        .maybeSingle();
      if (clash) {
        return NextResponse.json({ error: "This slug is already taken. Choose a different one." }, { status: 409 });
      }
      slug = candidate;
    }
  }

  const allowedFields = [
    "name", "whatsapp_message", "distribution_mode", "status",
    "seo_title", "seo_description", "seo_og_title", "seo_og_description",
    "seo_og_image", "seo_indexing", "canonical_url",
  ];

  const update: Record<string, unknown> = { slug };
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field];
  }

  const { data: dl, error } = await supabase
    .from("direct_links")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ direct_link: dl });
}

// DELETE /api/direct-links/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("direct_links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
