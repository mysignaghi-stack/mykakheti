-- Update the congratulations SELECT policy to allow admins to view all records
DROP POLICY IF EXISTS "Anyone can view approved congratulations" ON congratulations;

CREATE POLICY "Anyone can view approved congratulations; admins can view all" ON congratulations
  FOR SELECT USING (
    is_approved = true
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
