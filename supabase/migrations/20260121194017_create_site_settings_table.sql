-- Create site_settings table
CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value text
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view site settings" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON site_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES
('marquee_text', 'მოგესალმებით კახეთში!'),
('site_title', 'MYKAKHETI.GE'),
('site_description', 'კახეთის რეგიონის ინფორმაციული პორტალი'),
('contact_email', 'info@mykakheti.ge'),
('contact_phone', '+995 555 123456')
ON CONFLICT (key) DO NOTHING;