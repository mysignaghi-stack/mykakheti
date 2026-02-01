-- Fixes for Row-Level Security on `admin_posts`
--
-- Two approaches are provided below. Prefer the SECURE policy (option 2).
-- 1) QUICK (development): allow any authenticated user to manage admin_posts.
--    Run this only if you need an immediate dev unblock.
-- 2) SECURE (recommended): allow only users whose entry in `profiles` has role = 'admin'.

-- -----------------------------
-- Option 1 (Quick, permissive - development only)
-- -----------------------------
-- DROP existing strict policy and allow any authenticated user (temporarily):
DROP POLICY IF EXISTS "Admin can manage admin posts" ON public.admin_posts;
CREATE POLICY "Authenticated users can manage admin posts" ON public.admin_posts
	FOR ALL USING (auth.uid() IS NOT NULL);

-- -----------------------------
-- Option 2 (Secure, recommended)
-- -----------------------------
-- This policy permits only users who have a row in `profiles` with role = 'admin'.
-- It is the recommended policy for production administrative writes.
-- To apply the secure policy, run the DROP above, then the CREATE below (uncomment when ready).

-- DROP POLICY IF EXISTS "Authenticated users can manage admin posts" ON public.admin_posts;
-- CREATE POLICY "Admins can manage admin posts" ON public.admin_posts
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
--     )
--   );

-- Notes:
-- - Run these statements in the Supabase SQL editor or via psql connected to your DB.
-- - Option 1 is a temporary fast unblock for development only.
-- - Option 2 is the secure approach: ensure your `profiles` table has correct `role` values for admin accounts.
-- Example to set an admin role for an existing user (replace email):
--   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';
