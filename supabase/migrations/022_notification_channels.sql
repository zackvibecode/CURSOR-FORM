-- Notification channel settings on user_settings
-- Safe for Supabase SQL Editor (one statement at a time, with exception guards).

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS n8n_webhook_url text;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notification_email text;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS telegram_bot_token text;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS telegram_notifications boolean DEFAULT false;

-- Optional realtime (ignore if already configured / no permission)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.submissions REPLICA IDENTITY FULL;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Replica identity skipped: %', SQLERRM;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'submissions already in supabase_realtime';
    WHEN OTHERS THEN
      RAISE NOTICE 'Realtime publication skipped: %', SQLERRM;
  END;
END $$;
