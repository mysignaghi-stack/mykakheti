-- Ensure correct storage RLS policies for admin-media and site-assets buckets
-- This will create or replace policies with proper authentication checks

-- For admin-media bucket
DROP POLICY IF EXISTS "Admin can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from admin-media" ON storage.objects;

CREATE POLICY "Authenticated users can upload to admin-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from admin-media" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

-- For site-assets bucket (relax from admin-only to authenticated users)
DROP POLICY IF EXISTS "Admins can upload site assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from site-assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload to site-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update site-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from site-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);