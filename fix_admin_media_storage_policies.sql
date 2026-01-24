-- Fix admin-media storage RLS policies for uploads
-- Also fix announcements bucket to allow video uploads
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-media', 'admin-media', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Step 2: Disable RLS temporarily to clean up
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Step 3: Delete ALL existing policies for both buckets
DELETE FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
  AND (polname LIKE '%admin-media%' OR polname LIKE '%announcements%');

-- Step 4: Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 5: Create clean policies for admin-media
CREATE POLICY "admin_media_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'admin-media');

CREATE POLICY "admin_media_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "admin_media_authenticated_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'admin-media' AND auth.uid() IS NOT NULL);

-- Step 6: Create clean policies for announcements (allow all file types including videos)
CREATE POLICY "announcements_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

CREATE POLICY "announcements_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

CREATE POLICY "announcements_authenticated_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

-- Step 7: Verify - this should return the new policies
SELECT polname, polcmd, polroles, polqual
FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
  AND (polqual LIKE '%admin-media%' OR polqual LIKE '%announcements%');

