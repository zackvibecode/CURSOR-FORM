import type { SubmissionNotificationPayload } from "./types";

interface SendTelegramNotificationInput {
  botToken: string;
  chatId: string;
  payload: SubmissionNotificationPayload;
}

/** Escape user content for Telegram HTML parse mode. */
function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtmlMessage(payload: SubmissionNotificationPayload): string {
  const answerLines = payload.submission.answers.map(({ label, value }) => {
    return `<b>${escapeTelegramHtml(label)}:</b> ${escapeTelegramHtml(value)}`;
  });

  return [
    "🔔 <b>New OneForm submission</b>",
    "",
    `<b>Form:</b> ${escapeTelegramHtml(payload.form.title)}`,
    "",
    answerLines.join("\n") || "(no answers)",
    "",
    `<a href="${escapeTelegramHtml(payload.dashboard_url)}">Open dashboard</a>`,
  ].join("\n");
}

function buildPlainMessage(payload: SubmissionNotificationPayload): string {
  const answerLines = payload.submission.answers.map(
    ({ label, value }) => `${label}: ${value}`
  );

  return [
    "🔔 New OneForm submission",
    "",
    `Form: ${payload.form.title}`,
    "",
    answerLines.join("\n") || "(no answers)",
    "",
    `Dashboard: ${payload.dashboard_url}`,
  ].join("\n");
}

async function postTelegramMessage(
  botToken: string,
  chatId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: string }> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text().catch(() => "");
  return { ok: response.ok, status: response.status, body: text };
}

export async function sendTelegramNotification({
  botToken,
  chatId,
  payload,
}: SendTelegramNotificationInput): Promise<void> {
  // Prefer HTML (safe for titles like "New Zealand North & South").
  const htmlResult = await postTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: buildHtmlMessage(payload),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });

  if (htmlResult.ok) return;

  // Fallback: plain text if HTML somehow fails (bad chat_id still fails both).
  const plainResult = await postTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: buildPlainMessage(payload),
    disable_web_page_preview: true,
  });

  if (plainResult.ok) return;

  throw new Error(
    `Telegram failed (html=${htmlResult.status}, plain=${plainResult.status}): ${(plainResult.body || htmlResult.body).slice(0, 300)}`
  );
}
