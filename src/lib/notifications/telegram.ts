import type { SubmissionNotificationPayload } from "./types";

interface SendTelegramNotificationInput {
  botToken: string;
  chatId: string;
  payload: SubmissionNotificationPayload;
}

export async function sendTelegramNotification({
  botToken,
  chatId,
  payload,
}: SendTelegramNotificationInput): Promise<void> {
  const answerText = payload.submission.answers
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n");

  const text = [
    "🔔 *New OneForm submission*",
    "",
    `*Form:* ${escapeTelegramMarkdown(payload.form.title)}`,
    "",
    escapeTelegramMarkdown(answerText),
    "",
    `[Open dashboard](${payload.dashboard_url})`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram failed (${response.status}): ${body.slice(0, 200)}`);
  }
}

function escapeTelegramMarkdown(value: string): string {
  return value.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
