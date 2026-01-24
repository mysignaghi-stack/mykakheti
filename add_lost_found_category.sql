-- Add category column to lost_found table
ALTER TABLE lost_found ADD COLUMN IF NOT EXISTS category TEXT;
