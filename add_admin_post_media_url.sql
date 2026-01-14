-- Add media_url column to admin_posts table if it does not exist
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS media_url TEXT;
