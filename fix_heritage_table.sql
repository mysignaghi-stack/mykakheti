-- Update kakheti_heritage table to match the data we're inserting
-- This script fixes the category constraint and adds insert policy

-- First, drop the existing check constraint
ALTER TABLE public.kakheti_heritage DROP CONSTRAINT IF EXISTS kakheti_heritage_category_check;

-- Update the check constraint to include all categories from our data
ALTER TABLE public.kakheti_heritage ADD CONSTRAINT kakheti_heritage_category_check
CHECK (category IN ('ისტორია', 'ბუნება', 'ღვინის კულტურა', 'ცნობილი ადამიანები', 'ლეგენდები'));

-- Add insert policy for authenticated users (or you can modify this based on your auth setup)
CREATE POLICY "Allow insert for authenticated users" ON public.kakheti_heritage
FOR INSERT WITH CHECK (true);

-- Or if you want to allow anyone to insert (for development):
-- DROP POLICY IF EXISTS "Kakheti heritage is publicly readable" ON public.kakheti_heritage;
-- CREATE POLICY "Allow all operations" ON public.kakheti_heritage FOR ALL USING (true);