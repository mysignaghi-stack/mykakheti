-- Create site-assets storage bucket for background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view site-assets
CREATE POLICY "Anyone can view site-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'site-assets');

-- Allow admin to upload to site-assets
CREATE POLICY "Admin can upload to site-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'site-assets');

-- Allow admin to delete from site-assets
CREATE POLICY "Admin can delete from site-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'site-assets');
