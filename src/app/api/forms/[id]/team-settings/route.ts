import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { formId: string } }) {
  const supabase = await createClient();

  // Verify user owns the form
  const { data: form } = await supabase
    .from("forms")
    .select("id, user_id")
    .eq("id", params.formId)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== form.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch team settings
  const { data: teamSettings, error } = await supabase
    .from("form_team_settings")
    .select("*")
    .eq("form_id", params.formId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned, which is fine (no settings yet)
    return NextResponse.json({ error: "Failed to fetch team settings" }, { status: 500 });
  }

  return NextResponse.json(teamSettings ?? { distribution_mode: "single", team_members: [] });
}

export async function PUT(request: Request, { params }: { params: { formId: string } }) {
  const supabase = await createClient();

  // Verify user owns the form
  const { data: form } = await supabase
    .from("forms")
    .select("id, user_id")
    .eq("id", params.formId)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== form.user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { distribution_mode, team_members } = body;

  // Validate
  if (!distribution_mode || !["single", "distribute", "conditional"].includes(distribution_mode)) {
    return NextResponse.json({ error: "Invalid distribution mode" }, { status: 400 });
  }

  if (!Array.isArray(team_members)) {
    return NextResponse.json({ error: "Team members must be an array" }, { status: 400 });
  }

  // Validate each team member
  for (const member of team_members) {
    if (!member.phone || typeof member.phone !== "string") {
      return NextResponse.json({ error: "Each team member must have a phone number" }, { status: 400 });
    }
  }

  // Upsert
  const { data, error } = await supabase
    .from("form_team_settings")
    .upsert(
      {
        form_id: params.formId,
        distribution_mode,
        team_members,
      },
      { onConflict: "form_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save team settings" }, { status: 500 });
  }

  return NextResponse.json(data);
}
