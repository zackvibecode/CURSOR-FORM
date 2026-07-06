import type { FormField } from "@/lib/form-schema";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { getAppUrl } from "@/lib/forms";
import type { SubmissionAnswerLine, SubmissionNotificationPayload } from "./types";

export function buildSubmissionAnswerLines(
  fields: FormField[],
  answers: Record<string, string>
): SubmissionAnswerLine[] {
  const lines: SubmissionAnswerLine[] = [];

  fields.forEach((field) => {
    if (field.type === "title" || field.type === "image" || field.type === "youtube") return;
    const value = answers[field.id]?.trim();
    if (!value) return;
    lines.push({ label: field.label, value });
  });

  return lines;
}

export function buildPlainTextSummary(
  formTitle: string,
  answerLines: SubmissionAnswerLine[]
): string {
  const lines = [`New lead — ${formTitle}`, ""];
  answerLines.forEach(({ label, value }) => {
    lines.push(`${label}: ${value}`);
  });
  return lines.join("\n");
}

export function buildSubmissionNotificationPayload(input: {
  form: { id: string; title: string; slug: string };
  fields: FormField[];
  answers: Record<string, string>;
  assignedPhone?: string | null;
  assignedName?: string | null;
  ownerEmail: string;
  ownerWhatsapp?: string | null;
}): SubmissionNotificationPayload {
  const answerLines = buildSubmissionAnswerLines(input.fields, input.answers);

  return {
    event: "oneform.submission.created",
    form: {
      id: input.form.id,
      title: input.form.title,
      slug: input.form.slug,
    },
    submission: {
      answers: answerLines,
      assigned_phone: input.assignedPhone,
      assigned_name: input.assignedName,
      submitted_at: new Date().toISOString(),
    },
    owner: {
      email: input.ownerEmail,
      whatsapp_number: input.ownerWhatsapp,
    },
    whatsapp_message: buildWhatsAppMessage(input.form.title, input.fields, input.answers),
    dashboard_url: getAppUrl("/dashboard/submissions"),
  };
}

export function buildHtmlEmailBody(payload: SubmissionNotificationPayload): string {
  const rows = payload.submission.answers
    .map(
      ({ label, value }) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;max-width:560px;">
      <h2 style="margin:0 0 12px;">New form submission</h2>
      <p style="margin:0 0 16px;color:#555;">Form: <strong>${escapeHtml(payload.form.title)}</strong></p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin:20px 0 0;">
        <a href="${payload.dashboard_url}" style="display:inline-block;background:#10D050;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">View in dashboard</a>
      </p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
