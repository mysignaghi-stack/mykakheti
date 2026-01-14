-- Remove all existing policies on site_settings (for a clean state)
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can update site settings" ON site_settings;

-- Enable RLS (if not already enabled)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select, insert, and update site_settings (for development; restrict in production)
CREATE POLICY "Anyone can view site settings" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert site settings" ON site_settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update site settings" ON site_settings
FOR UPDATE USING (true);
