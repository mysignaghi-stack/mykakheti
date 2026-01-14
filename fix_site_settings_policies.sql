-- Allow anyone to select, insert and update site_settings (for development; restrict in production)
CREATE POLICY "Anyone can select site settings" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert site settings" ON site_settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update site settings" ON site_settings
FOR UPDATE USING (true);
