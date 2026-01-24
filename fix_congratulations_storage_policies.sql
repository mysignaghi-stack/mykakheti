-- Fix congratulations storage bucket policies to allow anonymous uploads
-- Run this in Supabase SQL Editor

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('congratulations', 'congratulations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view congratulations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload congratulations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete congratulations" ON storage.objects;

-- Create new policies allowing anonymous uploads
CREATE POLICY "Anyone can view congratulations" ON storage.objects
FOR SELECT USING (bucket_id = 'congratulations');

CREATE POLICY "Users can upload congratulations" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'congratulations' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Authenticated can delete congratulations" ON storage.objects
FOR DELETE USING (
  bucket_id = 'congratulations' 
  AND auth.role() = 'authenticated'
);