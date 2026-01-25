-- Alternative approach: Use Supabase Dashboard instead of direct SQL
-- This script requires database owner privileges which most users don't have

-- INSTRUCTIONS FOR MANUAL FIX:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Storage
-- 3. For each bucket (admin-media and announcements):
--    a. Click on the bucket
--    b. Go to "Policies" tab
--    c. Delete all existing policies
--    d. Create new policies:
--       - SELECT: Allow all users (public read access)
--       - INSERT: Allow authenticated users only
--       - DELETE: Allow authenticated users only

-- If you have service role access, you can run this script in Supabase SQL Editor:

-- Step 1: Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-media', 'admin-media', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Step 2: Create policies using service role (if you have access)
-- Note: This requires service role privileges
CREATE POLICY "announcements_allow_all" ON storage.objects
FOR ALL USING (bucket_id = 'announcements');

CREATE POLICY "admin_media_allow_all" ON storage.objects
FOR ALL USING (bucket_id = 'admin-media');

