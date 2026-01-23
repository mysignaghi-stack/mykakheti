-- Set admin role for the testing admin user
-- Replace 'admin@example.com' with the actual admin email used for testing

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';  -- Replace with actual admin email

-- To find the admin user, you can run:
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email LIKE '%admin%';

-- After setting the role, the admin should be able to delete announcements and see pending announcements.