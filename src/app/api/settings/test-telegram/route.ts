import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/notifications/telegram";
import type { SubmissionNotificationPayload } from "@/lib/notifications/types";
import { getAppUrl } from "@/lib/forms";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("telegram_notifications, telegram_bot_token, telegram_chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const msg = error.message || "Failed to load settings";
    if (/telegram_/i.test(msg) || error.code === "42703") {
      return NextResponse.json(
        {
          error:
            "Telegram columns missing in database. Run migration 022_notification_channels.sql in Supabase SQL Editor.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const botToken = settings?.telegram_bot_token?.trim();
  const chatId = settings?.telegram_chat_id?.trim();

  if (!settings?.telegram_notifications) {
    return NextResponse.json(
      { error: "Turn on Telegram bot toggle and Save settings first." },
      { status: 400 }
    );
  }

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: "Bot token and Chat ID are required. Save settings first." },
      { status: 400 }
    );
  }

  const payload: SubmissionNotificationPayload = {
    event: "oneform.submission.created",
    form: {
      id: "test",
      title: "OneForm Telegram test",
      slug: "test",
    },
    submission: {
      answers: [{ label: "Status", value: "Telegram connection OK" }],
      submitted_at: new Date().toISOString(),
    },
    owner: {
      email: user.email ?? "",
    },
    whatsapp_message: "Telegram test",
    dashboard_url: getAppUrl("/dashboard/submissions"),
  };

  try {
    await sendTelegramNotification({ botToken, chatId, payload });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Telegram send failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
