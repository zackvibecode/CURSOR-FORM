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
    // #region agent log
    fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:settingsError',message:'Settings query error',data:{msg:settingsError.message,code:settingsError.code},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }

  // #region agent log
  fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:rawSettings',message:'Raw settings from DB',data:{settingsFound:!!settings,tgEnabled:settings?.telegram_notifications,hasToken:!!settings?.telegram_bot_token,hasChatId:!!settings?.telegram_chat_id,tgTokenLen:settings?.telegram_bot_token?.length,tgChatIdLen:settings?.telegram_chat_id?.length},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
  // #endregion

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

  const tgEnabled = !!(owner.telegram_notifications && owner.telegram_bot_token?.trim() && owner.telegram_chat_id?.trim());
  const tgMissingCreds = !!owner.telegram_notifications && !tgEnabled;

  // #region agent log
  fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:tgBranch',message:'Telegram branch decision',data:{tgEnabled,tgMissingCreds,tgToggle:owner.telegram_notifications,hasToken:!!owner.telegram_bot_token?.trim(),hasChatId:!!owner.telegram_chat_id?.trim(),taskCount:tasks.length+1},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion

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
      })
        .then(() => {
          // #region agent log
          fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'telegram.ts:success',message:'Telegram send SUCCESS',data:{},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        })
        .catch((error) => {
          logNotificationError("telegram", error);
          // #region agent log
          fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'telegram.ts:fail',message:'Telegram send FAILED',data:{msg:String(error)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
          // #endregion
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
  const isVercel = !!process.env.VERCEL;
  // #region agent log
  fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:schedule',message:'scheduleSubmissionNotificationsForOwner called',data:{isVercel,userId:job.userId,formId:job.form.id},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const task = runSubmissionNotificationsForOwner(job);
  // On Vercel, waitUntil keeps the function alive after the response is sent
  // so Telegram/email still deliver even though the user already redirected.
  if (isVercel) {
    waitUntil(task);
    return;
  }
  void task;
}

/** Awaitable version — use when caller wants to wait for notifications. */
export async function runSubmissionNotificationsForOwner(
  job: SubmissionNotificationJob
): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:runStart',message:'runSubmissionNotificationsForOwner START',data:{userId:job.userId,formId:job.form.id,hasPhone:!!job.assignedPhone},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const owner = await loadOwnerNotificationSettings(job.userId);
    // #region agent log
    fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:afterLoad',message:'Owner settings loaded',data:{ownerFound:!!owner,tgEnabled:owner?.telegram_notifications,hasToken:!!owner?.telegram_bot_token,hasChatId:!!owner?.telegram_chat_id,email:owner?.email,whatsappNotif:owner?.whatsapp_notifications},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!owner) {
      logNotificationError("dispatch", "owner settings could not be loaded");
      // #region agent log
      fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:ownerNull',message:'Owner NULL — settings load failed',data:{userId:job.userId},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:runDone',message:'runSubmissionNotificationsForOwner DONE',data:{userId:job.userId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (error) {
    logNotificationError("dispatch", error);
    // #region agent log
    fetch('http://127.0.0.1:7551/ingest/4dbbe78a-c7ad-441f-8435-395a025d02e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6a31c9'},body:JSON.stringify({sessionId:'6a31c9',location:'dispatch.ts:runError',message:'runSubmissionNotificationsForOwner ERROR',data:{msg:String(error),stack:error instanceof Error ? error.stack?.slice(0,500) : undefined},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }
}

export function dispatchSubmissionNotificationsInBackground(
  input: DispatchNotificationInput
): void {
  scheduleSubmissionNotifications(input);
}
