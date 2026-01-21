-- Fix RLS policy for admin_posts to allow authenticated users during development
-- This relaxes the policy temporarily

-- Drop the strict admin-only policy
DROP POLICY IF EXISTS "Admin can manage admin posts" ON admin_posts;

-- Create a more permissive policy for development
CREATE POLICY "Authenticated users can manage admin posts" ON admin_posts
FOR ALL USING (auth.uid() IS NOT NULL);