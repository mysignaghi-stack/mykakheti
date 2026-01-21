-- Obituaries / Funerals
create table if not exists public.obituaries (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  date_of_death date,
  funeral_at timestamp with time zone,
  funeral_place text,
  contacts text,
  notes text,
  image_url text,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Lost & Found
create table if not exists public.lost_found (
  id uuid default gen_random_uuid() primary key,
  kind text check (kind in ('lost','found')) not null,
  title text not null,
  description text,
  location text,
  event_date date,
  contact text,
  reward boolean default false,
  reward_note text,
  image_url text,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Masters directory
create table if not exists public.masters (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  profession text not null,
  phone text,
  location text,
  description text,
  rating_avg numeric default 0,
  ratings_count integer default 0,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.master_ratings (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.masters(id) on delete cascade,
  stars integer check (stars >= 1 and stars <= 5) not null,
  comment text,
  rater_fingerprint text,
  created_at timestamp with time zone default now(),
  unique(master_id, rater_fingerprint)
);

-- Enable RLS
ALTER TABLE obituaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for obituaries
CREATE POLICY "Anyone can view approved obituaries" ON obituaries
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert obituaries" ON obituaries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update obituaries" ON obituaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete obituaries" ON obituaries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies for lost_found
CREATE POLICY "Anyone can view approved lost_found" ON lost_found
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert lost_found" ON lost_found
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update lost_found" ON lost_found
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete lost_found" ON lost_found
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies for masters
CREATE POLICY "Anyone can view approved masters" ON masters
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert masters" ON masters
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update masters" ON masters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete masters" ON masters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies for master_ratings
CREATE POLICY "Anyone can view master_ratings" ON master_ratings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert master_ratings" ON master_ratings
  FOR INSERT WITH CHECK (true);