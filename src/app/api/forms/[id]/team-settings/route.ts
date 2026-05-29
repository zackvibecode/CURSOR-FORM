import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: form } = await supabase
    .from("forms")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const { data: teamSettings, error } = await supabase
    .from("form_team_settings")
    .select("*")
    .eq("form_id", id)
    .maybeSingle();

  if (error) {
    console.error("[team-settings] GET failed:", error.message);
    return NextResponse.json({ error: "Failed to fetch team settings" }, { status: 500 });
  }

  return NextResponse.json(
    teamSettings ?? { distribution_mode: "single", team_members: [], last_assigned_index: 0 }
  );
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: form } = await supabase
    .from("forms")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!form) {
    return NextResponse.json({ error: "Form not found or access denied" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { distribution_mode, team_members } = body;

  if (!distribution_mode || !["single", "distribute", "conditional"].includes(distribution_mode)) {
    return NextResponse.json({ error: "Invalid distribution mode" }, { status: 400 });
  }

  if (!Array.isArray(team_members)) {
    return NextResponse.json({ error: "Team members must be an array" }, { status: 400 });
  }

  const sanitizedMembers = team_members
    .filter((member: { phone?: string }) => member.phone?.trim())
    .map((member: { name?: string; phone: string }) => ({
      name: member.name?.trim() ?? "",
      phone: member.phone.trim(),
    }));

  if (distribution_mode === "distribute" && sanitizedMembers.length === 0) {
    return NextResponse.json(
      { error: "Add at least one team member for round-robin distribution" },
      { status: 400 }
    );
  }

  if (distribution_mode === "conditional") {
    return NextResponse.json(
      { error: "Conditional routing is coming soon" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("form_team_settings")
    .upsert(
      {
        form_id: id,
        distribution_mode,
        team_members: sanitizedMembers,
      },
      { onConflict: "form_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[team-settings] Upsert failed:", error.message);
    return NextResponse.json({ error: `Failed to save: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json(data);
}