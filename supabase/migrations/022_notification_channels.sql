-- Notification channel settings on user_settings
-- Run this in Supabase Dashboard → SQL Editor if Telegram settings fail to save.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS n8n_webhook_url text,
  ADD COLUMN IF NOT EXISTS notification_email text,
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_notifications boolean DEFAULT false;

-- Realtime: alert dashboard when new submissions arrive
ALTER TABLE public.submissions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END $$;
