-- Safe admin setup: Replace 'admin@example.com' with your actual email
-- This is the recommended approach

-- Step 1: Check current users
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Set admin role for specific user (change the email!)
UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
  ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
END
WHERE email = 'admin@example.com';  -- <-- CHANGE THIS TO YOUR EMAIL!

-- Step 3: Verify the change
SELECT email, raw_user_meta_data, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'admin@example.com';  -- <-- CHANGE THIS TO YOUR EMAIL!