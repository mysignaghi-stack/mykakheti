-- Completely reset site_settings RLS policies
-- Remove all existing policies and create clean ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can manage site settings" ON site_settings;

-- Ensure RLS is enabled
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create clean policies
CREATE POLICY "Anyone can view site settings" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage site settings" ON site_settings
FOR ALL USING (auth.uid() IS NOT NULL);