-- Fix RLS policy for site_settings to allow authenticated users
-- This ensures users can update site settings like background images

-- Drop the strict admin-only policy if it exists
DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;

-- The view policy should already exist, so we don't recreate it

-- Create policy for authenticated users to manage site settings
CREATE POLICY "Authenticated users can manage site settings" ON site_settings
FOR ALL USING (auth.uid() IS NOT NULL);