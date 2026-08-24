import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Meta Pixel IDs are numeric (typically 15–16 digits).
 * Guards against junk input and script injection via the pixel loader.
 */
const META_PIXEL_ID_PATTERN = /^\d{10,20}$/;

function normalizeMetaPixelId(
  pixelId: unknown
): { value: string | null; error?: string } {
  if (typeof pixelId !== "string") {
    return { value: null, error: "Meta Pixel ID mesti teks." };
  }

  const trimmed = pixelId.trim();

  if (!trimmed) {
    // Empty = user is clearing the field.
    return { value: null };
  }

  if (!META_PIXEL_ID_PATTERN.test(trimmed)) {
    return {
      value: null,
      error: "Meta Pixel ID tidak sah. Ia mesti nombor (contoh: 1234567890123456).",
    };
  }

  return { value: trimmed };
}

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

  // Validate the pixel ID before persisting — it is injected into the pixel
  // loader, so junk input must never reach the database.
  let metaPixelIdValue: string | null | undefined;
  if (meta_pixel_id !== undefined) {
    const normalized = normalizeMetaPixelId(meta_pixel_id);
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    metaPixelIdValue = normalized.value;
  }

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
        meta_pixel_id: metaPixelIdValue,
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

  // Pixel + notification settings are baked into the ISR-cached published-form
  // bundle — bust the cache so public forms pick up new settings immediately
  // instead of serving stale ones for up to 120s.
  revalidateTag("published-forms");

  return NextResponse.json({ settings: data });
}
