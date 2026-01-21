-- Fix storage RLS policies for admin-media bucket
-- Add authentication checks to prevent RLS violations

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can upload to admin-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from admin-media" ON storage.objects;

-- Create updated policies with authentication checks
CREATE POLICY "Authenticated users can upload to admin-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from admin-media" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

-- Also fix site-assets bucket policies if they exist
DROP POLICY IF EXISTS "Admin can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from site-assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload to site-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from site-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'site-assets' AND auth.uid() IS NOT NULL);