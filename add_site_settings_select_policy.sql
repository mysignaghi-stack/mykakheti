-- Allow anyone to select site_settings
CREATE POLICY "Anyone can select site settings" ON site_settings
FOR SELECT USING (true);
