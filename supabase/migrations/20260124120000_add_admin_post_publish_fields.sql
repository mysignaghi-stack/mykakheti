-- Add publishing fields to admin_posts table
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create index for publish_at
CREATE INDEX IF NOT EXISTS idx_admin_posts_publish_at ON admin_posts(publish_at);

-- Update existing posts to be published
UPDATE admin_posts SET is_published = TRUE WHERE is_published IS NULL;