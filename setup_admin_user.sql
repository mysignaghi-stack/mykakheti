-- Setup admin user in Supabase Auth
-- Run this in Supabase SQL Editor or as a migration

-- First, create the admin user (replace with actual email and password)
-- Note: This should be done through the Supabase dashboard or CLI for security
-- The user metadata will be set when creating the user

-- Example of how to set admin role for an existing user:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'admin@example.com';

-- For new user creation, use the Supabase Auth API or dashboard
-- and include role: 'admin' in user_metadata

-- Alternative: Create a function to promote users to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
  WHERE email = user_email;
END;
$$;

-- Grant execute permission to authenticated users (you may want to restrict this)
-- GRANT EXECUTE ON FUNCTION promote_to_admin(TEXT) TO authenticated;

-- Note: For security, it's better to manually update user metadata through the Supabase dashboard
-- or use the Admin API rather than exposing this function.