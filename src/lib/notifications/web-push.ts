import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubmissionNotificationPayload } from "./types";

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
  tag?: string;
};

function logPushError(message: string, error?: unknown) {
  console.error(`[notifications:web-push] ${message}`, error ?? "");
}

export function getVapidConfig(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} | null {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    "";
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || "";
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:notifications@form.zaqone.com";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

function configureWebPush() {
  const vapid = getVapidConfig();
  if (!vapid) return null;
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return vapid;
}

/** Prefer name-like / service-like fields; keep body short for lock-screen privacy. */
export function buildWebPushPayload(
  payload: SubmissionNotificationPayload
): WebPushPayload {
  const answers = payload.submission.answers ?? [];

  const nameKeys = ["name", "nama", "full name", "customer", "pelanggan"];
  const serviceKeys = [
    "package",
    "pakej",
    "service",
    "perkhidmatan",
    "destination",
    "destinasi",
    "product",
    "produk",
  ];

  const findByKeys = (keys: string[]) =>
    answers.find((line) => {
      const label = line.label.trim().toLowerCase();
      return keys.some((key) => label === key || label.includes(key));
    })?.value?.trim();

  const customerName = findByKeys(nameKeys) || answers[0]?.value?.trim() || "A customer";
  const service =
    findByKeys(serviceKeys) || payload.form.title.trim() || "your form";

  const body = `${truncate(customerName, 40)} submitted an enquiry for ${truncate(service, 60)}`;

  return {
    title: "New Form Submission",
    body,
    url: "/dashboard/submissions",
    icon: "/favicon-icon.png",
    badge: "/favicon-icon.png",
    tag: `submission-${payload.form.id}`,
  };
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function isGoneStatus(statusCode?: number) {
  return statusCode === 404 || statusCode === 410;
}

async function deactivateSubscription(id: string) {
  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("id", id);
  if (error) {
    logPushError(`failed to deactivate subscription ${id}`, error.message);
  }
}

export async function sendPushToUserSubscriptions(
  userId: string,
  notification: WebPushPayload
): Promise<void> {
  if (!configureWebPush()) {
    logPushError("VAPID keys not configured — skipping web push");
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    logPushError("admin client unavailable");
    return;
  }

  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    logPushError("failed to load subscriptions", error.message);
    return;
  }

  const subscriptions = (rows ?? []) as PushSubscriptionRecord[];
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(notification);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          body,
          {
            TTL: 60 * 60,
            urgency: "high",
          }
        );
      } catch (err) {
        const statusCode =
          typeof err === "object" && err && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : undefined;

        if (isGoneStatus(statusCode)) {
          await deactivateSubscription(sub.id);
          return;
        }

        logPushError(`send failed for ${sub.id}`, err);
      }
    })
  );
}

export async function sendSubmissionWebPush(
  userId: string,
  payload: SubmissionNotificationPayload
): Promise<void> {
  await sendPushToUserSubscriptions(userId, buildWebPushPayload(payload));
}
