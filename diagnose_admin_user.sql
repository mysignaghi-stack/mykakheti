-- Diagnostic script to check user metadata and fix admin role
-- Run this in Supabase SQL Editor

-- 1. Check all users and their metadata
SELECT
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Set admin role for a specific user (replace with actual email)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin-email@example.com';

-- 3. Alternative: Clear and set fresh metadata
-- UPDATE auth.users
-- SET raw_user_meta_data = '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin-email@example.com';

-- 4. Check if the user exists and has correct metadata
-- SELECT email, raw_user_meta_data
-- FROM auth.users
-- WHERE email = 'your-admin-email@example.com';