-- Add is_vip column to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

-- Index for fast VIP queries
CREATE INDEX IF NOT EXISTS idx_announcements_is_vip ON announcements (is_vip) WHERE is_vip = true;
