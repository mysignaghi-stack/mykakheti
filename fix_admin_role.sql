-- Quick fix: Set admin role for existing user
-- Replace 'your-email@example.com' with the actual admin email

UPDATE auth.users
SET raw_user_meta_data = CASE
  WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
  ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
END
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT email, raw_user_meta_data, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-email@example.com';