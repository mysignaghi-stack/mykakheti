-- Add is_approved column for congratulations moderation
-- Run this in Supabase SQL Editor

ALTER TABLE public.congratulations
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_congratulations_is_approved
  ON public.congratulations(is_approved);
