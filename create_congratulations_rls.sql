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
CREATE POLICY "Admin can update congratulations" ON public.congratulations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
      u.raw_user_meta_data->> 'role' = 'admin'
      OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_user_meta_data->> 'is_admin' = 'true'
      OR u.raw_app_meta_data->> 'role' = 'admin'
      OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_app_meta_data->> 'is_admin' = 'true'
    )
  )
);

DROP POLICY IF EXISTS "Authenticated can delete congratulations" ON public.congratulations;
CREATE POLICY "Admin can delete congratulations" ON public.congratulations
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
      u.raw_user_meta_data->> 'role' = 'admin'
      OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_user_meta_data->> 'is_admin' = 'true'
      OR u.raw_app_meta_data->> 'role' = 'admin'
      OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_app_meta_data->> 'is_admin' = 'true'
    )
  )
);
