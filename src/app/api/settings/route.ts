import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    business_name,
    whatsapp_number,
    default_message,
    theme_color,
    redirect_after_submit,
    email_notifications,
    whatsapp_notifications,
    submission_alerts,
    meta_pixel_id,
    meta_pixel_enabled,
    n8n_webhook_url,
    notification_email,
    telegram_bot_token,
    telegram_chat_id,
    telegram_notifications,
  } = body;

  // Upsert: update if exists, insert if not
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        business_name,
        whatsapp_number,
        default_message,
        theme_color,
        redirect_after_submit,
        email_notifications,
        whatsapp_notifications,
        submission_alerts,
        meta_pixel_id,
        meta_pixel_enabled,
        n8n_webhook_url,
        notification_email,
        telegram_bot_token,
        telegram_chat_id,
        telegram_notifications,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    const message = error.message || "Failed to save settings";
    // Helpful hint when migration 022 was never applied on the remote DB.
    if (/telegram_|n8n_webhook|notification_email/i.test(message) || error.code === "42703") {
      return NextResponse.json(
        {
          error:
            "Database belum ada column Telegram. Buka Supabase → SQL Editor, run file supabase/migrations/022_notification_channels.sql, lepas tu Save semula.",
          details: message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
