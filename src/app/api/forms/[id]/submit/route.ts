import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbFieldToFormField } from "@/lib/forms";
import { buildAnswersSchema } from "@/lib/form-schema";
import { checkSubmissionLimitForOwner } from "@/lib/check-limits";
import { resolveSubmissionRecipient } from "@/lib/resolve-recipient";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import {
  scheduleSubmissionNotifications,
  loadOwnerNotificationSettings,
} from "@/lib/notifications/dispatch";
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

  const ip = ipFromRequest(request);
  const limit = rateLimit(`submit:${ip}:${id}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();

  const [{ data: form }, { data: fields }] = await Promise.all([
    supabase
      .from("forms")
      .select("id, status, whatsapp_number, user_id, title, slug")
      .eq("id", id)
      .single(),
    supabase.from("form_fields").select("*").eq("form_id", id).order("order_index"),
  ]);

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Form is not accepting submissions" }, { status: 403 });
  }

  const parsedFields = (fields ?? []).map(mapDbFieldToFormField);
  const answersSchema = buildAnswersSchema(parsedFields);
  const result = answersSchema.safeParse(body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path[0],
      message: issue.message,
    }));
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  const [limitCheck, resolved, ownerSettings] = await Promise.all([
    checkSubmissionLimitForOwner(form.user_id, id),
    resolveSubmissionRecipient(supabase, id, form.whatsapp_number?.trim() ?? ""),
    loadOwnerNotificationSettings(form.user_id),
  ]);

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

  if (!resolved?.phone) {
    return NextResponse.json(
      {
        error: "team_routing_failed",
        message:
          "Team rotator is enabled but no team WhatsApp numbers are configured. Add team members in Form Settings → Team.",
      },
      { status: 400 }
    );
  }

  const assignedPhone = resolved.phone;
  const assignedName = resolved.name;

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

  if (ownerSettings) {
    scheduleSubmissionNotifications({
      form: {
        id: form.id,
        title: form.title,
        slug: form.slug,
        user_id: form.user_id,
      },
      fields: parsedFields,
      answers: result.data,
      assignedPhone,
      assignedName,
      owner: ownerSettings,
    });
  }

  return NextResponse.json({
    success: true,
    whatsapp_number: assignedPhone,
    assigned_name: assignedName,
    from_team: resolved.fromTeam,
  });
}
