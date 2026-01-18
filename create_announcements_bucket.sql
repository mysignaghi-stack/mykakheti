-- Create announcements storage bucket for user ad images
-- Run this in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view announcements" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated can upload announcements" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'announcements' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete own announcements" ON storage.objects
FOR DELETE USING (
  bucket_id = 'announcements' AND auth.uid() IS NOT NULL
);
