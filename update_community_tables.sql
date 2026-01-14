-- Extend lost_found with categories, reward, expiry, resolved
alter table if exists public.lost_found
  add column if not exists category text check (category in ('document','pet','keys_items','other')),
  add column if not exists reward boolean default false,
  add column if not exists reward_note text,
  add column if not exists expires_at timestamp with time zone,
  add column if not exists resolved boolean default false;

-- Extend masters with richer profile
alter table if exists public.masters
  add column if not exists photo_url text,
  add column if not exists service_area text,
  add column if not exists price_note text,
  add column if not exists verified boolean default false,
  add column if not exists admin_recommended boolean default false;

-- Portfolio table
create table if not exists public.master_portfolio (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.masters(id) on delete cascade,
  media_url text not null,
  created_at timestamp with time zone default now()
);

-- Allow single owner reply per rating
alter table if exists public.master_ratings
  add column if not exists owner_reply text,
  add column if not exists owner_reply_at timestamp with time zone;

-- Moderation: add is_approved flags
alter table if exists public.obituaries
  add column if not exists is_approved boolean default false;
alter table if exists public.lost_found
  add column if not exists is_approved boolean default false;
alter table if exists public.masters
  add column if not exists is_approved boolean default false;
