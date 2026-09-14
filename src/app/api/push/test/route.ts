import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidConfig, sendPushToUserSubscriptions } from "@/lib/notifications/web-push";

/**
 * Authenticated self-test for staff devices.
 * Does not accept arbitrary broadcast text from the public.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getVapidConfig()) {
    return NextResponse.json(
      { error: "Web Push is not configured on the server." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { count } = await admin
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!count) {
    return NextResponse.json(
      { error: "No active push subscriptions on this account. Enable notifications first." },
      { status: 400 }
    );
  }

  try {
    await sendPushToUserSubscriptions(user.id, {
      title: "OneForm Test Notification",
      body: "Push notifications are working on this device.",
      url: "/dashboard/settings",
      icon: "/favicon-icon.png",
      badge: "/favicon-icon.png",
      tag: "oneform-push-test",
    });
  } catch (error) {
    console.error("[push:test]", error);
    return NextResponse.json({ error: "Failed to send test notification" }, { status: 500 });
  }

  return NextResponse.json({ success: true, devices: count });
}
