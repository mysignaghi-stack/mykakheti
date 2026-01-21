-- Create square_messages table
CREATE TABLE square_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text,
  sender_name text,
  media_url text,
  media_type text,
  ip_address inet,
  fingerprint text,
  parent_id uuid REFERENCES square_messages(id),
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE square_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view square messages" ON square_messages
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert square messages" ON square_messages
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own square messages" ON square_messages
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete square messages" ON square_messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_square_messages_created_at ON square_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_square_messages_parent_id ON square_messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_square_messages_archived_at ON square_messages(archived_at);