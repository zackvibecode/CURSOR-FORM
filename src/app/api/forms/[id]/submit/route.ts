import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapDbFieldToFormField } from "@/lib/forms";
import { buildAnswersSchema } from "@/lib/form-schema";
import { headers } from "next/headers";

// Simple in-memory rate limiter (per form_id)
// In production, use Redis or Supabase Edge Function
const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(formId: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(formId);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(formId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_SUBMISSIONS_PER_MINUTE) {
    return false;
  }

  entry.count += 1;
  return true;
}

function getIpHash(): string | null {
  const headersList = headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || null;
  if (!ip) return null;
  // Simple hash — in production use crypto.hash or similar
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

  // 1. Check form exists and is published
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

  // 2. Check WhatsApp number is configured
  if (!form.whatsapp_number || !form.whatsapp_number.trim()) {
    return NextResponse.json({ error: "WhatsApp number not configured for this form" }, { status: 400 });
  }

  // 3. Rate limiting
  if (!checkRateLimit(id)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  // 4. Fetch form fields to validate against
  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("order_index");

  const parsedFields = (fields ?? []).map(mapDbFieldToFormField);
  const answersSchema = buildAnswersSchema(parsedFields);

  // 5. Parse and validate body
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

  // 6. Insert submission with validated data + IP hash
  const { error } = await supabase.from("submissions").insert({
    form_id: id,
    data: result.data,
    ip_hash: getIpHash(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
