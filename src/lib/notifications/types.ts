import type { FormField } from "@/lib/form-schema";

export interface SubmissionAnswerLine {
  label: string;
  value: string;
}

export interface SubmissionNotificationPayload {
  event: "oneform.submission.created";
  form: {
    id: string;
    title: string;
    slug: string;
  };
  submission: {
    answers: SubmissionAnswerLine[];
    assigned_phone?: string | null;
    assigned_name?: string | null;
    submitted_at: string;
  };
  owner: {
    email: string;
    whatsapp_number?: string | null;
  };
  whatsapp_message: string;
  dashboard_url: string;
}

export interface NotificationOwnerSettings {
  email: string;
  whatsapp_number?: string | null;
  email_notifications?: boolean;
  whatsapp_notifications?: boolean;
  submission_alerts?: boolean;
  telegram_notifications?: boolean;
  n8n_webhook_url?: string | null;
  notification_email?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
}

export interface DispatchNotificationInput {
  form: {
    id: string;
    title: string;
    slug: string;
    user_id: string;
  };
  fields: FormField[];
  answers: Record<string, string>;
  assignedPhone?: string | null;
  assignedName?: string | null;
  owner: NotificationOwnerSettings;
}
