import type { SubmissionNotificationPayload } from "./types";

export async function sendN8nWebhook(
  webhookUrl: string,
  payload: SubmissionNotificationPayload
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`n8n webhook failed (${response.status}): ${body.slice(0, 200)}`);
  }
}
