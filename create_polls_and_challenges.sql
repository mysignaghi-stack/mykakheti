-- Polls schema
create table if not exists public.polls (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  status text default 'draft',
  created_at timestamp with time zone default now()
);

create table if not exists public.poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade,
  text text not null
);

create table if not exists public.poll_votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade,
  option_id uuid references public.poll_options(id) on delete cascade,
  voter_fingerprint text,
  created_at timestamp with time zone default now(),
  unique(poll_id, voter_fingerprint)
);

-- Challenges schema
create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  status text default 'draft',
  created_at timestamp with time zone default now()
);
