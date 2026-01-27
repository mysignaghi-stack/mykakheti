-- Create agro_prices table for agro market data
CREATE TABLE IF NOT EXISTS agro_prices (
  id text PRIMARY KEY,
  name text NOT NULL,
  unit text,
  price text,
  color text,
  icon text,
  category text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agro_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view agro prices" ON agro_prices;
DROP POLICY IF EXISTS "Admin can manage agro prices" ON agro_prices;

CREATE POLICY "Anyone can view agro prices" ON agro_prices
FOR SELECT USING (true);

CREATE POLICY "Admin can manage agro prices" ON agro_prices
FOR ALL
USING (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
