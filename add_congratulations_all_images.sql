-- Add all_images column for multiple congratulation photos
-- Run this in Supabase SQL Editor

ALTER TABLE public.congratulations
  ADD COLUMN IF NOT EXISTS all_images text[];
