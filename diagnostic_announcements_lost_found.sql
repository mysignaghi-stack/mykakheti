-- Diagnostic script for announcements and lost_found tables
-- Run this in Supabase SQL Editor to check RLS policies and data

-- 1. Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('announcements', 'lost_found');

-- 2. List policies for announcements
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'announcements'
ORDER BY policyname;

-- 3. List policies for lost_found
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'lost_found'
ORDER BY policyname;

-- 4. Check recent announcements (last 10)
SELECT id, title, is_approved, user_id, created_at
FROM announcements
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check recent lost_found (last 10)
SELECT id, title, is_approved, created_at
FROM lost_found
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if there are users with announcements
SELECT a.id, a.title, a.user_id, u.email, u.raw_user_meta_data
FROM announcements a
LEFT JOIN auth.users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 7. Test insert permission (run as authenticated user)
-- This should be tested in the app, but to check RLS:
-- As an authenticated user, try inserting:
-- INSERT INTO announcements (title, category, location, price, user_id, is_approved)
-- VALUES ('Test', 'other', 'Test', '100', auth.uid()::uuid, false);

-- 8. Check storage policies for announcements bucket
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%announcements%'
ORDER BY policyname;

-- 9. Check storage policies for lost_found bucket
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%lost_found%'
ORDER BY policyname;