-- Create announcements table
CREATE TABLE announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  location text NOT NULL,
  price text NOT NULL,
  currency text,
  contact_info text,
  phone text,
  image_url text,
  all_images text[],
  is_approved boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  publish_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view approved announcements" ON announcements
FOR SELECT USING (is_approved = true);

CREATE POLICY "Authenticated users can insert announcements" ON announcements
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own announcements" ON announcements
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own announcements" ON announcements
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all announcements" ON announcements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_is_approved ON announcements(is_approved);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON announcements(publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id);