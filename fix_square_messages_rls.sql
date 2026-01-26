-- Fix square_messages RLS policy to allow anonymous inserts
-- Since this is a public chat feature, anyone should be able to post messages

DROP POLICY IF EXISTS "Authenticated users can insert square messages" ON square_messages;

CREATE POLICY "Anyone can insert square messages" ON square_messages
FOR INSERT WITH CHECK (true);