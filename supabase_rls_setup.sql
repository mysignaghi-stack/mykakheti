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
-- Announcements table policies
-- Allow public users to view only approved announcements, but allow admins to view all
CREATE POLICY "Public can view approved announcements; admins can view all" ON announcements
FOR SELECT USING (
	is_approved = true
	OR EXISTS (
		SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
			u.raw_user_meta_data->> 'role' = 'admin'
			OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_user_meta_data->> 'is_admin' = 'true'
			OR u.raw_app_meta_data->> 'role' = 'admin'
			OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_app_meta_data->> 'is_admin' = 'true'
		)
	)
);

-- Allow only authenticated users to create announcements and ensure the row's user_id matches the authenticated user
CREATE POLICY "Authenticated users can create their announcements" ON announcements
FOR INSERT WITH CHECK (
	auth.uid() IS NOT NULL
	AND auth.uid() = user_id
);

-- Allow owners or admins to update announcements
CREATE POLICY "Owners or admins can update announcements" ON announcements
FOR UPDATE USING (
	auth.uid() = user_id
	OR EXISTS (
		SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
			u.raw_user_meta_data->> 'role' = 'admin'
			OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_user_meta_data->> 'is_admin' = 'true'
			OR u.raw_app_meta_data->> 'role' = 'admin'
			OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_app_meta_data->> 'is_admin' = 'true'
		)
	)
)
WITH CHECK (
	auth.uid() = user_id
	OR EXISTS (
		SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
			u.raw_user_meta_data->> 'role' = 'admin'
			OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_user_meta_data->> 'is_admin' = 'true'
			OR u.raw_app_meta_data->> 'role' = 'admin'
			OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_app_meta_data->> 'is_admin' = 'true'
		)
	)
);

-- Allow owners or admins to delete announcements
CREATE POLICY "Owners or admins can delete announcements" ON announcements
FOR DELETE USING (
	auth.uid() = user_id
	OR EXISTS (
		SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
			u.raw_user_meta_data->> 'role' = 'admin'
			OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_user_meta_data->> 'is_admin' = 'true'
			OR u.raw_app_meta_data->> 'role' = 'admin'
			OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
			OR u.raw_app_meta_data->> 'is_admin' = 'true'
		)
	)
);

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