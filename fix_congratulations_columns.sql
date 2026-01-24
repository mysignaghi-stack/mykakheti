-- Combined SQL to add missing columns to congratulations table
-- Run this in Supabase SQL Editor

-- Add all_images column
ALTER TABLE public.congratulations
  ADD COLUMN IF NOT EXISTS all_images text[];

-- Add category column
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS category TEXT;

-- Add is_approved column
ALTER TABLE public.congratulations
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Add template, toast, music_url, animation_enabled
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'თანამედროვე მინიმალიზმი';
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS toast TEXT;
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT false;

-- Add user_id if not exists
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_congratulations_is_approved
  ON public.congratulations(is_approved);

-- Update existing records
UPDATE congratulations SET template = 'თანამედროვე მინიმალიზმი' WHERE template IS NULL;
UPDATE congratulations SET is_approved = false WHERE is_approved IS NULL;
UPDATE congratulations SET animation_enabled = false WHERE animation_enabled IS NULL;