-- Check current RLS policies on site_settings
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'site_settings'
ORDER BY policyname;