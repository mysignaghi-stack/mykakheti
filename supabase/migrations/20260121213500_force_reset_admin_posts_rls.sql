-- Force reset admin_posts policies as well to ensure consistency
-- Disable RLS temporarily
ALTER TABLE admin_posts DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT polname FROM pg_policy WHERE polrelid = 'admin_posts'::regclass
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON admin_posts';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE admin_posts ENABLE ROW LEVEL SECURITY;

-- Create clean policies
CREATE POLICY "admin_posts_select_policy" ON admin_posts
FOR SELECT USING (true);

CREATE POLICY "admin_posts_insert_policy" ON admin_posts
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_posts_update_policy" ON admin_posts
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_posts_delete_policy" ON admin_posts
FOR DELETE USING (auth.uid() IS NOT NULL);