-- Update announcements insert policy to allow anonymous users
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON announcements;

CREATE POLICY "Users can insert announcements" ON announcements
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  (auth.uid() IS NULL AND user_id IS NULL)
);