-- ONE-CLICK ADMIN FIX - Copy and paste this entire block into Supabase SQL Editor

-- This will fix admin access in one go
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Update all users to have admin role
    UPDATE auth.users
    SET raw_user_meta_data = CASE
        WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
        ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
    END;

    -- Show results
    RAISE NOTICE 'Admin role added to all users. Check results below:';
END $$;

-- Verify the fix worked
SELECT
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users
ORDER BY created_at DESC;