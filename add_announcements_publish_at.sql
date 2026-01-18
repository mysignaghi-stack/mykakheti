-- Add publish_at column for scheduled announcements
-- Run this in Supabase SQL Editor

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS publish_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_announcements_publish_at
  ON public.announcements(publish_at);
