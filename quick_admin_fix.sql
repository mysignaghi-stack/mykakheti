-- QUICK FIX: Make all existing users admin temporarily
-- WARNING: This is for testing only! Remove this after setup!

UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
  ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
END
WHERE raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' != 'admin';

-- Check the result
SELECT email, raw_user_meta_data->>'role' as role, created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;