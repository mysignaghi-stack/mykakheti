-- Add archive support to admin_posts
-- Run in Supabase SQL Editor

ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
