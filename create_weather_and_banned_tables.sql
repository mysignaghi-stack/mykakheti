-- Weather data table
create table if not exists public.weather (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  lat numeric not null,
  lon numeric not null,
  temp numeric,
  icon text,
  glow text,
  created_at timestamp with time zone default now()
);

-- Banned users table for IP blocking
create table if not exists public.banned_users (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null unique,
  reason text,
  banned_at timestamp with time zone default now(),
  banned_by text
);

-- Enable RLS
alter table public.weather enable row level security;
alter table public.banned_users enable row level security;

-- Weather policies (allow read for all)
create policy "Weather data is viewable by everyone" on public.weather
  for select using (true);

-- Banned users policies (only admins can manage)
create policy "Admins can manage banned users" on public.banned_users
  for all using (
    exists (
      select 1 from public.site_settings
      where key = 'admin_session' and value = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Allow public to check if their session is banned
create policy "Anyone can check if banned" on public.banned_users
  for select using (true);