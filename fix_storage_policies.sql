-- Fix storage policies for proper RLS compliance
-- Run this in Supabase SQL Editor

-- Drop existing policies for admin-media bucket
DROP POLICY IF EXISTS "Admin can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from admin-media" ON storage.objects;

-- Recreate policies with proper auth checks
CREATE POLICY "Admin can upload to admin-media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'admin-media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Anyone can view admin-media" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-media');

CREATE POLICY "Admin can delete from admin-media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'admin-media' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Also fix site-assets bucket policies if they exist
DROP POLICY IF EXISTS "Admin can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from site-assets" ON storage.objects;

CREATE POLICY "Admin can upload to site-assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'site-assets' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Anyone can view site-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admin can delete from site-assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'site-assets' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);