-- RLS policies for congratulations moderation
-- Run this in Supabase SQL Editor

ALTER TABLE public.congratulations ENABLE ROW LEVEL SECURITY;

-- Public can view approved cards
DROP POLICY IF EXISTS "Public can view approved congratulations" ON public.congratulations;
CREATE POLICY "Public can view approved congratulations" ON public.congratulations
FOR SELECT USING (is_approved = true);

-- Authenticated users can submit cards
DROP POLICY IF EXISTS "Authenticated can submit congratulations" ON public.congratulations;
CREATE POLICY "Authenticated can submit congratulations" ON public.congratulations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can moderate (approve/delete)
DROP POLICY IF EXISTS "Authenticated can update congratulations" ON public.congratulations;
CREATE POLICY "Authenticated can update congratulations" ON public.congratulations
FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can delete congratulations" ON public.congratulations;
CREATE POLICY "Authenticated can delete congratulations" ON public.congratulations
FOR DELETE USING (auth.uid() IS NOT NULL);
