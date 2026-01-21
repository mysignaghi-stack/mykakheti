-- Force reset all site_settings policies and recreate them properly
-- This should completely remove any policies that reference auth.users

-- Disable RLS temporarily
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (using a more aggressive approach)
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT polname FROM pg_policy WHERE polrelid = 'site_settings'::regclass
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON site_settings';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create clean, simple policies
CREATE POLICY "site_settings_select_policy" ON site_settings
FOR SELECT USING (true);

CREATE POLICY "site_settings_insert_policy" ON site_settings
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "site_settings_update_policy" ON site_settings
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "site_settings_delete_policy" ON site_settings
FOR DELETE USING (auth.uid() IS NOT NULL);