-- Create square-media storage bucket for chat uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('square-media', 'square-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for square-media
DROP POLICY IF EXISTS "square_media_public_read" ON storage.objects;
CREATE POLICY "square_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'square-media');

-- Allow anyone to upload chat media
DROP POLICY IF EXISTS "square_media_public_upload" ON storage.objects;
CREATE POLICY "square_media_public_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'square-media');

-- Allow admins to delete chat media (optional)
DROP POLICY IF EXISTS "square_media_admin_delete" ON storage.objects;
CREATE POLICY "square_media_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'square-media'
    AND coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
