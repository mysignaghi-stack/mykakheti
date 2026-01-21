-- Admin user setup script
-- Run this in Supabase SQL Editor to create admin user

-- First, create the admin user (replace with actual email)
-- Note: This should be done through Supabase Auth UI, not SQL

-- Update RLS policies to properly check for admin role
-- This assumes you have created an admin user with role 'admin' in user_metadata

-- Update existing policies to be more secure
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can manage admin posts" ON admin_posts;
DROP POLICY IF EXISTS "Admin can manage businesses" ON businesses;

-- More secure admin policies
CREATE POLICY "Admin can update announcements" ON announcements
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Allow admins to delete announcements as well
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;
CREATE POLICY "Admin can delete announcements" ON announcements
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin can manage admin posts" ON admin_posts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin can manage businesses" ON businesses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Update community table policies
DROP POLICY IF EXISTS "Admin can manage obituaries" ON obituaries;
DROP POLICY IF EXISTS "Admin can manage lost_found" ON lost_found;
DROP POLICY IF EXISTS "Admin can manage masters" ON masters;

CREATE POLICY "Admin can manage obituaries" ON obituaries
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin can manage lost_found" ON lost_found
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admin can manage masters" ON masters
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Update site_settings policies
DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;

CREATE POLICY "Admin can manage site settings" ON site_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Update agro_prices policies
DROP POLICY IF EXISTS "Admin can manage agro prices" ON agro_prices;

CREATE POLICY "Admin can manage agro prices" ON agro_prices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);