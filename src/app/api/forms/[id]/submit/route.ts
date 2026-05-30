import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbFieldToFormField } from "@/lib/forms";
import { buildAnswersSchema } from "@/lib/form-schema";
import { checkSubmissionLimit } from "@/lib/check-limits";
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

  // Check submission limit
  const limitCheck = await checkSubmissionLimit(id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "submission_limit_reached",
        message: `This form has reached its ${limitCheck.plan} plan limit of ${limitCheck.max} submissions this month.`,
        limit: limitCheck,
      },
      { status: 403 }
    );
  }

  // Resolve recipient via SECURITY DEFINER RPC so it works for anonymous
  // public visitors. (Reading form_team_settings directly is blocked by RLS
  // for anonymous users, which previously made every lead fall back to the
  // form's default number instead of rotating.)
  let assignedPhone: string = form.whatsapp_number?.trim() ?? "";
  let assignedName: string | null = null;

  const { data: recipient, error: recipientError } = await supabase.rpc(
    "resolve_form_recipient",
    { p_form_id: id }
  );

  if (recipientError) {
    console.warn("[team-rotator] resolve_form_recipient failed:", recipientError.message);
  } else if (Array.isArray(recipient) && recipient.length > 0) {
    const r = recipient[0] as { member_name: string | null; member_phone: string | null };
    if (r?.member_phone?.trim()) {
      assignedPhone = r.member_phone.trim();
      assignedName = r.member_name?.trim() || null;
    }
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
    assigned_name: assignedName,
    assigned_phone: assignedPhone || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, whatsapp_number: assignedPhone });
}