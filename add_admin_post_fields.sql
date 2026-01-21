-- Add new fields to admin_posts table
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS video_background BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'ოფიციალური განცხადება';
