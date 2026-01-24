-- Fix admin-media storage policies
-- This migration should be applied through Supabase CLI: supabase db push
-- Or run individual commands in SQL Editor if you have permissions

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-media', 'admin-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Admin can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from admin-media" ON storage.objects;

-- Create new policies
CREATE POLICY "admin_media_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-media');

CREATE POLICY "admin_media_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_media_authenticated_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);