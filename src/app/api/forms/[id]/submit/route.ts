import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbFieldToFormField } from "@/lib/forms";
import { buildAnswersSchema } from "@/lib/form-schema";
import { type TeamSettingsRow } from "@/lib/team-distribution";
import { headers } from "next/headers";

function getIpHash(): string | null {
  const headersList = headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || null;
  if (!ip) return null;
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, status, whatsapp_number, user_id")
    .eq("id", id)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Form is not accepting submissions" }, { status: 403 });
  }

  // Fetch team settings to determine WhatsApp number and rotation
  let teamSettings: TeamSettingsRow | null = null;

  const { data: tsData } = await supabase
    .from("form_team_settings")
    .select("distribution_mode, team_members, last_assigned_index")
    .eq("form_id", id)
    .maybeSingle();

  if (tsData) {
    teamSettings = {
      distribution_mode: tsData.distribution_mode,
      team_members: tsData.team_members ?? [],
      last_assigned_index: tsData.last_assigned_index ?? 0,
    };
  }

  let assignedPhone: string = form.whatsapp_number?.trim() ?? "";

  // Handle round-robin distribution via RPC
  if (teamSettings?.distribution_mode === "distribute" && teamSettings.team_members.length > 0) {
    const members = teamSettings.team_members.filter((m) => m.phone?.trim());

    if (members.length > 0) {
      const { data: claimedIndex, error: rpcError } = await supabase.rpc(
        "claim_next_rotation_index",
        { p_form_id: id, p_member_count: members.length }
      );

      if (rpcError) {
        console.error("[team-rotator] RPC failed:", rpcError.message);
        // Fallback: use non-atomic computation
        const idx = ((teamSettings.last_assigned_index % members.length) + members.length) % members.length;
        assignedPhone = members[idx].phone.trim();

        // Best-effort update
        const nextIdx = (idx + 1) % members.length;
        await supabase.rpc("claim_next_rotation_index", { p_form_id: id, p_member_count: members.length });
      } else if (claimedIndex !== null && claimedIndex !== undefined) {
        assignedPhone = members[claimedIndex].phone.trim();
      } else {
        // Fallback: just get first member
        assignedPhone = members[0].phone.trim();
      }
    }
  } else if (teamSettings?.distribution_mode === "single" && teamSettings.team_members.length === 1) {
    assignedPhone = teamSettings.team_members[0].phone?.trim() || assignedPhone;
  }

  if (!assignedPhone) {
    return NextResponse.json(
      { error: "WhatsApp number not configured for this form" },
      { status: 400 }
    );
  }

  // Fetch form fields & build validation schema
  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("order_index");

  const parsedFields = (fields ?? []).map(mapDbFieldToFormField);
  const answersSchema = buildAnswersSchema(parsedFields);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = answersSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path[0],
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("submissions").insert({
    form_id: id,
    data: result.data,
    ip_hash: getIpHash(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, whatsapp_number: assignedPhone });
}