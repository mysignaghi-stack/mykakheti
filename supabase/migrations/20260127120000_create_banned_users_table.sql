create table if not exists public.banned_users (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null unique,
  reason text,
  banned_at timestamp with time zone default now(),
  banned_by text
);

alter table public.banned_users enable row level security;

drop policy if exists "Admins can manage banned users" on public.banned_users;
create policy "Admins can manage banned users" on public.banned_users
  for all using (
    exists (
      select 1 from public.site_settings
      where key = 'admin_session' and value = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

drop policy if exists "Anyone can check if banned" on public.banned_users;
create policy "Anyone can check if banned" on public.banned_users
  for select using (true);