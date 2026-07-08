import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSubmissionNotificationPayload } from "./format-submission";
import { sendN8nWebhook } from "./n8n";
import { sendSubmissionEmail } from "./resend";
import { sendTelegramNotification } from "./telegram";
import type { DispatchNotificationInput, NotificationOwnerSettings } from "./types";

type SubmissionNotificationJob = Omit<DispatchNotificationInput, "owner"> & {
  userId: string;
};

function logNotificationError(channel: string, error: unknown) {
  console.error(`[notifications:${channel}]`, error);
}

export async function loadOwnerNotificationSettings(
  userId: string
): Promise<NotificationOwnerSettings | null> {
  const admin = createAdminClient();
  if (!admin) {
    logNotificationError("admin", "SUPABASE_SERVICE_ROLE_KEY / URL missing");
    return null;
  }

  const [{ data: profile }, { data: settings, error: settingsError }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", userId).maybeSingle(),
    admin
      .from("user_settings")
      .select(
        "whatsapp_number, email_notifications, whatsapp_notifications, submission_alerts, telegram_notifications, n8n_webhook_url, notification_email, telegram_bot_token, telegram_chat_id"
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (settingsError) {
    logNotificationError("settings", settingsError.message);
    // If telegram columns are missing, still return defaults so email/n8n can run,
    // but telegram will stay off until migration is applied.
  }

  // Email is preferred but not required for Telegram / n8n channels.
  return {
    email: profile?.email ?? "",
    whatsapp_number: settings?.whatsapp_number ?? null,
    email_notifications: settings?.email_notifications ?? true,
    whatsapp_notifications: settings?.whatsapp_notifications ?? false,
    submission_alerts: settings?.submission_alerts ?? true,
    telegram_notifications: settings?.telegram_notifications ?? false,
    n8n_webhook_url: settings?.n8n_webhook_url ?? null,
    notification_email: settings?.notification_email ?? null,
    telegram_bot_token: settings?.telegram_bot_token ?? null,
    telegram_chat_id: settings?.telegram_chat_id ?? null,
  };
}

export async function dispatchSubmissionNotifications(
  input: DispatchNotificationInput
): Promise<void> {
  const { owner } = input;
  const payload = buildSubmissionNotificationPayload({
    form: input.form,
    fields: input.fields,
    answers: input.answers,
    assignedPhone: input.assignedPhone,
    assignedName: input.assignedName,
    ownerEmail: owner.email,
    ownerWhatsapp: owner.whatsapp_number,
  });

  const tasks: Array<Promise<void>> = [];

  if (
    owner.whatsapp_notifications &&
    owner.n8n_webhook_url?.trim()
  ) {
    tasks.push(
      sendN8nWebhook(owner.n8n_webhook_url.trim(), payload).catch((error) => {
        logNotificationError("n8n", error);
      })
    );
  }

  if (owner.email_notifications) {
    const emailTo = owner.notification_email?.trim() || owner.email;
    if (!emailTo) {
      // skip — no address configured
    } else if (process.env.RESEND_API_KEY) {
      tasks.push(
        sendSubmissionEmail({ to: emailTo, payload }).catch((error) => {
          logNotificationError("resend", error);
        })
      );
    } else {
      logNotificationError("resend", "RESEND_API_KEY is not configured");
    }
  }

  if (
    owner.telegram_notifications &&
    owner.telegram_bot_token?.trim() &&
    owner.telegram_chat_id?.trim()
  ) {
    tasks.push(
      sendTelegramNotification({
        botToken: owner.telegram_bot_token.trim(),
        chatId: owner.telegram_chat_id.trim(),
        payload,
      }).catch((error) => {
        logNotificationError("telegram", error);
      })
    );
  } else if (owner.telegram_notifications) {
    logNotificationError(
      "telegram",
      "enabled but bot token or chat id is missing in Settings"
    );
  }

  await Promise.allSettled(tasks);
}

export function scheduleSubmissionNotifications(input: DispatchNotificationInput): void {
  const task = dispatchSubmissionNotifications(input).catch((error) => {
    logNotificationError("dispatch", error);
  });

  if (process.env.VERCEL) {
    waitUntil(task);
    return;
  }

  void task;
}

export function scheduleSubmissionNotificationsForOwner(job: SubmissionNotificationJob): void {
  void runSubmissionNotificationsForOwner(job);
}

/** Awaitable version — use on submit so Telegram finishes before function ends. */
export async function runSubmissionNotificationsForOwner(
  job: SubmissionNotificationJob
): Promise<void> {
  try {
    const owner = await loadOwnerNotificationSettings(job.userId);
    if (!owner) {
      logNotificationError("dispatch", "owner settings could not be loaded");
      return;
    }
    await dispatchSubmissionNotifications({
      form: job.form,
      fields: job.fields,
      answers: job.answers,
      assignedPhone: job.assignedPhone,
      assignedName: job.assignedName,
      owner,
    });
  } catch (error) {
    logNotificationError("dispatch", error);
  }
}

export function dispatchSubmissionNotificationsInBackground(
  input: DispatchNotificationInput
): void {
  scheduleSubmissionNotifications(input);
}
