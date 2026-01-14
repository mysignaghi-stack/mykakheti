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
