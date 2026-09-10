import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

// GET /api/direct-links/[id]/team
export async function GET(_req: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: dl } = await supabase
    .from("direct_links")
    .select("id, distribution_mode")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: members, error } = await supabase
    .from("direct_link_team_members")
    .select("*")
    .eq("direct_link_id", id)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: state } = await supabase
    .from("direct_link_distribution_state")
    .select("current_slot, total_weight")
    .eq("direct_link_id", id)
    .maybeSingle();

  return NextResponse.json({
    distribution_mode: dl.distribution_mode,
    team_members: members ?? [],
    distribution_state: state ?? { current_slot: 0, total_weight: 0 },
  });
}

// PUT /api/direct-links/[id]/team
export async function PUT(request: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: dl } = await supabase
    .from("direct_links")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { distribution_mode?: string; team_members?: unknown[] };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { distribution_mode, team_members } = body;

  if (!distribution_mode || !["single", "distribute", "conditional"].includes(distribution_mode)) {
    return NextResponse.json({ error: "Invalid distribution_mode" }, { status: 400 });
  }
  if (distribution_mode === "conditional") {
    return NextResponse.json({ error: "Conditional routing is coming soon" }, { status: 400 });
  }
  if (!Array.isArray(team_members)) {
    return NextResponse.json({ error: "team_members must be an array" }, { status: 400 });
  }

  // Sanitize and validate members
  const sanitized = (team_members as Record<string, unknown>[])
    .filter((m) => typeof m.phone_number === "string" && m.phone_number.trim())
    .map((m, i) => {
      const raw_phone = String(m.phone_number ?? "").replace(/\D/g, "");
      // Strip leading country code if accidentally included
      const country_code = String(m.country_code ?? "60").replace(/\D/g, "") || "60";
      return {
        direct_link_id: id,
        name: String(m.name ?? "").trim(),
        country_code,
        phone_number: raw_phone,
        weight: Math.max(1, parseInt(String(m.weight ?? 1), 10) || 1),
        active: m.active !== false,
        position: i,
      };
    });

  if (distribution_mode !== "single" && sanitized.length === 0) {
    return NextResponse.json({ error: "Add at least one team member" }, { status: 400 });
  }

  // Update distribution_mode on the direct_link
  await supabase
    .from("direct_links")
    .update({ distribution_mode })
    .eq("id", id);

  // Replace all team members atomically: delete existing, insert new
  const { error: delError } = await supabase
    .from("direct_link_team_members")
    .delete()
    .eq("direct_link_id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  let members: Record<string, unknown>[] = [];
  if (sanitized.length > 0) {
    const { data: inserted, error: insError } = await supabase
      .from("direct_link_team_members")
      .insert(sanitized)
      .select();
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
    members = inserted ?? [];
  }

  // Recalculate distribution state
  const activeMembers = sanitized.filter((m) => m.active);
  const totalWeight = activeMembers.reduce((sum, m) => sum + m.weight, 0);

  // Get existing state to preserve slot if possible
  const { data: existingState } = await supabase
    .from("direct_link_distribution_state")
    .select("current_slot")
    .eq("direct_link_id", id)
    .maybeSingle();

  let currentSlot = existingState?.current_slot ?? 0;
  if (totalWeight > 0 && currentSlot >= totalWeight) {
    currentSlot = 0; // reset if slot is out of bounds
  }
  if (totalWeight === 0) currentSlot = 0;

  // Upsert distribution state
  await supabase
    .from("direct_link_distribution_state")
    .upsert(
      { direct_link_id: id, current_slot: currentSlot, total_weight: totalWeight },
      { onConflict: "direct_link_id" }
    );

  return NextResponse.json({ team_members: members, distribution_mode });
}
