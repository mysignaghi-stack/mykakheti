-- Update kakheti_heritage table to match the data we're inserting
-- This script fixes the category constraint and adds insert policy

-- First, drop the existing check constraint
ALTER TABLE public.kakheti_heritage DROP CONSTRAINT IF EXISTS kakheti_heritage_category_check;

-- Update the check constraint to include all categories from our data
ALTER TABLE public.kakheti_heritage ADD CONSTRAINT kakheti_heritage_category_check
CHECK (category IN ('ისტორია', 'ბუნება', 'ღვინის კულტურა', 'ცნობილი ადამიანები', 'ლეგენდები'));

-- Add insert policy for admins only
CREATE POLICY "Allow insert for admins" ON public.kakheti_heritage
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add update policy for admins
CREATE POLICY "Allow update for admins" ON public.kakheti_heritage
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add delete policy for admins
CREATE POLICY "Allow delete for admins" ON public.kakheti_heritage
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);