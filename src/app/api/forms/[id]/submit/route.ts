import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapDbFieldToFormField } from "@/lib/forms";
import { buildAnswersSchema } from "@/lib/form-schema";
import { resolveWhatsAppNumber, type TeamSettingsRow } from "@/lib/team-distribution";
import { headers } from "next/headers";

// Per-form rate limiting via Supabase DB to work across serverless instances.
// Falls back to allowing the request if the check itself fails.
const MAX_SUBMISSIONS_PER_MINUTE = 10;

async function checkRateLimit(admin: ReturnType<typeof createAdminClient>, formId: string): Promise<boolean> {
  if (!admin) return true;

  const windowStart = new Date(Date.now() - 60_000).toISOString();

  const { count, error } = await admin
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("form_id", formId)
    .gte("created_at", windowStart);

  if (error) {
    console.error("[rate-limit] Failed to check rate limit:", error.message);
    return true;
  }

  return (count ?? 0) < MAX_SUBMISSIONS_PER_MINUTE;
}

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

/**
 * Atomically claim the next round-robin slot using a Supabase RPC.
 * Returns the claimed index, or null if team settings don't exist / aren't in distribute mode.
 */
async function claimNextRotationIndex(
  admin: ReturnType<typeof createAdminClient>,
  formId: string,
  memberCount: number
): Promise<number | null> {
  if (!admin || memberCount <= 0) return null;

  const { data, error } = await admin.rpc("claim_next_rotation_index", {
    p_form_id: formId,
    p_member_count: memberCount,
  });

  if (error) {
    console.error("[team-rotator] RPC claim_next_rotation_index failed:", error.message);
    return null;
  }

  return data as number;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, status, whatsapp_number")
    .eq("id", id)
    .single();

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Form is not accepting submissions" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.warn("[team-rotator] Admin client unavailable — SUPABASE_SERVICE_ROLE_KEY may be missing. Team distribution will be skipped.");
  }

  let teamSettings: TeamSettingsRow | null = null;

  if (admin) {
    const { data, error } = await admin
      .from("form_team_settings")
      .select("distribution_mode, team_members, last_assigned_index")
      .eq("form_id", id)
      .maybeSingle();

    if (error) {
      console.error("[team-rotator] Failed to fetch team settings:", error.message);
    } else if (data) {
      teamSettings = {
        distribution_mode: data.distribution_mode,
        team_members: data.team_members ?? [],
        last_assigned_index: data.last_assigned_index ?? 0,
      };
    }
  }

  let assignedPhone: string;

  if (teamSettings?.distribution_mode === "distribute" && teamSettings.team_members.length > 0 && admin) {
    const members = teamSettings.team_members.filter((m) => m.phone?.trim());
    const claimedIndex = await claimNextRotationIndex(admin, id, members.length);

    if (claimedIndex !== null) {
      assignedPhone = members[claimedIndex].phone.trim();
    } else {
      console.warn("[team-rotator] Atomic claim failed, falling back to non-atomic resolution");
      const fallback = resolveWhatsAppNumber(form.whatsapp_number ?? "", teamSettings);
      assignedPhone = fallback.phone;
    }
  } else {
    const resolved = resolveWhatsAppNumber(form.whatsapp_number ?? "", teamSettings);
    assignedPhone = resolved.phone;
  }

  if (!assignedPhone) {
    return NextResponse.json(
      { error: "WhatsApp number not configured for this form" },
      { status: 400 }
    );
  }

  if (!(await checkRateLimit(admin, id))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

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

  const { error } = await supabase.from("submissions").insert({
    form_id: id,
    data: result.data,
    ip_hash: getIpHash(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, whatsapp_number: assignedPhone });
}
