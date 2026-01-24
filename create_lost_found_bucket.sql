-- Create lost_found storage bucket for user images
-- Run this in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('lost_found', 'lost_found', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view lost_found" ON storage.objects
FOR SELECT USING (bucket_id = 'lost_found');

CREATE POLICY "Authenticated can upload lost_found" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'lost_found' AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Authenticated can delete own lost_found" ON storage.objects
FOR DELETE USING (
  bucket_id = 'lost_found' AND auth.uid() IS NOT NULL
);