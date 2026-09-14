import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVapidConfig } from "@/lib/notifications/web-push";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapid = getVapidConfig();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, device_name, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: Boolean(vapid),
    publicKey: vapid?.publicKey ?? null,
    subscriptions: data ?? [],
  });
}
