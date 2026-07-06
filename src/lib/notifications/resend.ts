import { buildHtmlEmailBody, buildPlainTextSummary } from "./format-submission";
import type { SubmissionNotificationPayload } from "./types";

interface SendSubmissionEmailInput {
  to: string;
  payload: SubmissionNotificationPayload;
}

export async function sendSubmissionEmail({
  to,
  payload,
}: SendSubmissionEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "OneForm <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const text = buildPlainTextSummary(payload.form.title, payload.submission.answers);
  const html = buildHtmlEmailBody(payload);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New lead — ${payload.form.title}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend failed (${response.status}): ${body.slice(0, 200)}`);
  }
}
