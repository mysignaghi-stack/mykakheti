-- Fix RLS policy for admin_posts to allow authenticated users
-- This temporarily relaxes the policy for development

-- Drop the strict admin-only policy
DROP POLICY IF EXISTS "Admin can manage admin posts" ON admin_posts;

-- Create a more permissive policy for development
CREATE POLICY "Authenticated users can manage admin posts" ON admin_posts
FOR ALL USING (auth.uid() IS NOT NULL);

-- Alternative: If you want to keep admin-only but fix the role check
-- First, ensure your admin user has the role set:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin-email@example.com';