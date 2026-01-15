-- Profiles table (if missing)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are self-manageable" on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- Announcements ownership
alter table public.announcements
  add column if not exists user_id uuid references auth.users(id);

alter table public.announcements enable row level security;

create policy "Users can insert own announcements" on public.announcements
for insert
with check (auth.uid() = user_id);

create policy "Users can update own announcements" on public.announcements
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Announcements readable" on public.announcements
for select
using (true);

create policy "Users can delete own announcements" on public.announcements
for delete
using (auth.uid() = user_id);
