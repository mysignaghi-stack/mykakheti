-- Create admin-media storage bucket
-- Run this in Supabase SQL Editor first

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-media', 'admin-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for admin-media bucket
CREATE POLICY "Admin can upload to admin-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media');

CREATE POLICY "Anyone can view admin-media" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-media');

CREATE POLICY "Admin can delete from admin-media" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media');