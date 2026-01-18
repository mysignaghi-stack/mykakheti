-- Add user_id column to announcements for ownership
-- Run this in Supabase SQL Editor

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_announcements_user_id
  ON public.announcements(user_id);
