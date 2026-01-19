-- Add all_images column for multiple lost-found photos
-- Run this in Supabase SQL Editor

ALTER TABLE public.lost_found
  ADD COLUMN IF NOT EXISTS all_images text[];