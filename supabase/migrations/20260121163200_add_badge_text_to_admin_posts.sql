-- Add badge_text column to admin_posts table
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'ოფიციალური განცხადება';