-- AUTOMATIC ADMIN FIX - Run this in Supabase SQL Editor
-- This will make the most recently created user an admin

-- Find the most recent user
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- Make the most recent user admin
UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
  ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
END
WHERE id = (
  SELECT id FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1
);

-- Verify the change
SELECT id, email, raw_user_meta_data, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;