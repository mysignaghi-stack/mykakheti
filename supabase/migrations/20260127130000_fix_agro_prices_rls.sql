-- Fix agro_prices admin policy to avoid auth.users access
ALTER TABLE agro_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage agro prices" ON agro_prices;

CREATE POLICY "Admin can manage agro prices" ON agro_prices
FOR ALL
USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
