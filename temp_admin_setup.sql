-- Temporary admin setup - Run this in Supabase SQL Editor
-- This will create a temporary admin user for testing

-- 1. First, let's see what users exist
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Pick the most recent user and make them admin (replace with actual email)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'replace-with-your-email@example.com';

-- 3. Alternative: Make ALL users admin temporarily (for testing only!)
-- WARNING: This is insecure! Only use for testing!
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'admin';

-- 4. Check the result
-- SELECT email, raw_user_meta_data->>'role' as role FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin';