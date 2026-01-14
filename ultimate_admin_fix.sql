-- ULTIMATE ADMIN FIX - Run this in Supabase SQL Editor
-- This will make ALL existing users admins (for testing)

-- Step 1: See all current users
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Make ALL users admins (temporary solution)
UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
  ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
END;

-- Step 3: Verify all users are now admins
SELECT id, email, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
ORDER BY created_at DESC;

-- WARNING: This makes EVERYONE an admin! Use only for testing.
-- After testing, you should remove admin role from regular users.