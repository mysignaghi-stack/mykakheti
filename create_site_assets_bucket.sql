-- FIX STORAGE UPLOAD ISSUES (v3)
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. Ensure Bucket is Public and Exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('announcements', 'announcements', true, 5242880, ARRAY['image/png','image/jpeg','image/jpg','image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png','image/jpeg','image/jpg','image/webp'];

-- 2. Drop potential blocking policies (clean slate for this bucket)
DROP POLICY IF EXISTS "Anyone can view announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated full access announcements" ON storage.objects;
DROP POLICY IF EXISTS "Give me access please" ON storage.objects;
DROP POLICY IF EXISTS "Announcements Public View" ON storage.objects;
DROP POLICY IF EXISTS "Announcements Auth Upload" ON storage.objects;
-- Also drop policies that might have been created with generic names
DROP POLICY IF EXISTS "Announcements Public View v2" ON storage.objects;
DROP POLICY IF EXISTS "Announcements Auth Insert v2" ON storage.objects;
DROP POLICY IF EXISTS "Announcements Auth Modify v2" ON storage.objects;
DROP POLICY IF EXISTS "Announcements Auth Delete v2" ON storage.objects;


-- 3. Create Simplified, Permissive Policies

-- Allow PUBLIC read access
CREATE POLICY "Announcements Public View v2" ON storage.objects
FOR SELECT USING ( bucket_id = 'announcements' );

-- Allow AUTHENTICATED or ANONYMOUS upload (insert) 
-- Key fix: Allow anonymous uploads for simplified registration
CREATE POLICY "Announcements Auth Insert v2" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'announcements' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Allow AUTHENTICATED update 
CREATE POLICY "Announcements Auth Modify v2" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'announcements' 
  AND auth.role() = 'authenticated'
);

-- Allow AUTHENTICATED delete
CREATE POLICY "Announcements Auth Delete v2" ON storage.objects
FOR DELETE USING (
  bucket_id = 'announcements' 
  AND auth.role() = 'authenticated'
);

-- Note: 'storage.objects' already has RLS enabled by default. 
-- We do not need to ALTER it or GRANT permissions usually.
-- If you still get permission errors, ensure you are running this in the Supabase SQL Editor.
