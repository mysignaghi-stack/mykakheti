-- Create congratulations cards table
CREATE TABLE IF NOT EXISTS congratulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  message TEXT NOT NULL,
  occasion TEXT NOT NULL, -- დაბადების დღე, დაქორწინება, სხვა
  image_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE congratulations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely (idempotent runs)
DROP POLICY IF EXISTS "Anyone can view approved congratulations" ON congratulations;
DROP POLICY IF EXISTS "Anyone can insert congratulations" ON congratulations;
DROP POLICY IF EXISTS "Admins can update congratulations" ON congratulations;
DROP POLICY IF EXISTS "Admins can delete congratulations" ON congratulations;

-- Policies for congratulations
CREATE POLICY "Anyone can view approved congratulations" ON congratulations
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert congratulations" ON congratulations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update congratulations" ON congratulations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete congratulations" ON congratulations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create storage bucket for congratulations images
INSERT INTO storage.buckets (id, name, public)
VALUES ('congratulations', 'congratulations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for congratulations bucket
DROP POLICY IF EXISTS "Anyone can view congratulations images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload congratulations images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete congratulations images" ON storage.objects;

CREATE POLICY "Anyone can view congratulations images" ON storage.objects
  FOR SELECT USING (bucket_id = 'congratulations');

CREATE POLICY "Anyone can upload congratulations images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'congratulations');

CREATE POLICY "Admins can delete congratulations images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'congratulations' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );