-- Update announcements bucket policies to allow video uploads
-- Run this in Supabase SQL Editor

-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Delete existing policies for announcements bucket
DELETE FROM pg_policy
WHERE polrelid = 'storage.objects'::regclass
  AND polqual LIKE '%announcements%';

-- Create new permissive policies that allow all file types including videos
CREATE POLICY "Anyone can view announcements" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

CREATE POLICY "Authenticated can upload any file to announcements" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete from announcements" ON storage.objects
FOR DELETE USING (bucket_id = 'announcements' AND auth.uid() IS NOT NULL);

-- Alternative: If the above doesn't work, try creating a policy that specifically allows video files
-- CREATE POLICY "Allow video uploads to announcements" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'announcements'
--   AND auth.uid() IS NOT NULL
--   AND (metadata->>'mimetype' LIKE 'video/%' OR metadata->>'mimetype' LIKE 'image/%')
-- );