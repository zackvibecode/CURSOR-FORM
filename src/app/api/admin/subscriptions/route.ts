import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/is-admin";

// GET: list all subscription requests (admin only).
// Optional ?status=pending filter.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use the service role so we can read every user's subscription + email,
  // which RLS would otherwise hide.
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = admin
    .from("subscriptions")
    .select("id, user_id, plan, status, billing_cycle, started_at, expires_at, updated_at")
    .order("updated_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: subs, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Join emails from profiles (or auth) for display.
  const userIds = Array.from(new Set((subs ?? []).map((s) => s.user_id)));
  const emailMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      if (p.email) emailMap.set(p.id, p.email);
    }
  }

  const result = (subs ?? []).map((s) => ({
    ...s,
    email: emailMap.get(s.user_id) ?? "(unknown)",
  }));

  return NextResponse.json({ subscriptions: result });
}

// POST: approve or reject a subscription request (admin only).
// Body: { user_id: string, action: "approve" | "reject" }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  let body: { user_id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetUserId = typeof body.user_id === "string" ? body.user_id : "";
  const action = body.action;

  if (!targetUserId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json(
      { error: "user_id and action ('approve' | 'reject') are required." },
      { status: 400 }
    );
  }

  // Fetch the pending request first.
  const { data: current, error: fetchError } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  if (action === "approve") {
    const { data: updated, error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: null,
      })
      .eq("user_id", targetUserId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      subscription: updated,
      message: `Approved ${current.plan} plan for user.`,
    });
  }

  // Reject: downgrade back to free/active.
  const { data: updated, error: updateError } = await admin
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      billing_cycle: "monthly",
      started_at: new Date().toISOString(),
      expires_at: null,
    })
    .eq("user_id", targetUserId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    subscription: updated,
    message: "Request rejected. User set back to free plan.",
  });
}
