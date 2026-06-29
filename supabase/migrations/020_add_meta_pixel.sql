-- Add Meta Pixel tracking fields to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_pixel_enabled BOOLEAN NOT NULL DEFAULT FALSE;
