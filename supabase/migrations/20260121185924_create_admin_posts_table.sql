-- Create admin_posts table
CREATE TABLE admin_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  media_urls TEXT[],
  media_url TEXT,
  video_background BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  link TEXT,
  position TEXT,
  badge_text TEXT DEFAULT 'ოფიციალური განცხადება',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view admin posts" ON admin_posts
FOR SELECT USING (true);

CREATE POLICY "Admin can manage admin posts" ON admin_posts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_posts_position ON admin_posts(position);