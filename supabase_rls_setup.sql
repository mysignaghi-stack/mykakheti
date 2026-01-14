-- RLS Policies for mykakheti.ge
-- Run these SQL commands in your Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE square_messages ENABLE ROW LEVEL SECURITY;

-- Announcements table policies
-- Allow anyone to view approved announcements
CREATE POLICY "Anyone can view approved announcements" ON announcements
FOR SELECT USING (is_approved = true);

-- Allow anyone to insert new announcements
CREATE POLICY "Anyone can create announcements" ON announcements
FOR INSERT WITH CHECK (true);

-- Allow admin operations (you'll need to implement proper admin auth)
CREATE POLICY "Admin can update announcements" ON announcements
FOR UPDATE USING (true);

CREATE POLICY "Admin can delete announcements" ON announcements
FOR DELETE USING (true);

-- Contact messages policies
CREATE POLICY "Anyone can send contact messages" ON contact_messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view contact messages" ON contact_messages
FOR SELECT USING (true);

CREATE POLICY "Admin can delete contact messages" ON contact_messages
FOR DELETE USING (true);

-- Admin posts policies
CREATE POLICY "Anyone can view admin posts" ON admin_posts
FOR SELECT USING (true);

CREATE POLICY "Admin can manage admin posts" ON admin_posts
FOR ALL USING (true);

-- Businesses policies
CREATE POLICY "Anyone can view businesses" ON businesses
FOR SELECT USING (true);

CREATE POLICY "Admin can manage businesses" ON businesses
FOR ALL USING (true);

-- Agro prices policies
CREATE POLICY "Anyone can view agro prices" ON agro_prices
FOR SELECT USING (true);

CREATE POLICY "Admin can manage agro prices" ON agro_prices
FOR ALL USING (true);

-- Site settings policies
CREATE POLICY "Anyone can view site settings" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Admin can manage site settings" ON site_settings
FOR ALL USING (true);

-- Square messages policies
CREATE POLICY "Anyone can view square messages" ON square_messages
FOR SELECT USING (true);

CREATE POLICY "Anyone can send square messages" ON square_messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage square messages" ON square_messages
FOR ALL USING (true);

-- Ensure position column exists in admin_posts table
ALTER TABLE admin_posts ADD COLUMN IF NOT EXISTS position TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_posts_position ON admin_posts(position);

-- Storage bucket policies for admin-media
-- Allow admin uploads and public reads
INSERT INTO storage.buckets (id, name, public) VALUES ('admin-media', 'admin-media', true)
ON CONFLICT (id) DO NOTHING;

-- Admin media bucket policies
CREATE POLICY "Admin can upload to admin-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media');

CREATE POLICY "Anyone can view admin-media" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-media');

CREATE POLICY "Admin can delete from admin-media" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media');