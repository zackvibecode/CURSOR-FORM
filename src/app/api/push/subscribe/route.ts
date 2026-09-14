import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidConfig } from "@/lib/notifications/web-push";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
  device_name: z.string().max(120).optional().nullable(),
  user_agent: z.string().max(512).optional().nullable(),
});

export async function GET() {
  const vapid = getVapidConfig();
  return NextResponse.json({
    publicKey: vapid?.publicKey ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    configured: Boolean(vapid),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = ipFromRequest(request);
  const limit = rateLimit(`push-subscribe:${user.id}:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: "Web Push is not configured on the server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { endpoint, keys, device_name, user_agent } = parsed.data;
  const ua =
    user_agent?.trim() ||
    request.headers.get("user-agent")?.slice(0, 512) ||
    null;

  // Service-role write after session auth so endpoint can be reassigned
  // when the same device switches accounts (unique endpoint constraint).
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        device_name: device_name?.trim() || null,
        user_agent: ua,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    )
    .select("id, endpoint, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, subscription: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let endpoint: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.endpoint === "string") {
      endpoint = body.endpoint;
    }
  } catch {
    // optional body
  }

  let query = supabase
    .from("push_subscriptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
