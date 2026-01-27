create table if not exists public.transport_routes (
  id bigserial primary key,
  origin text not null,
  destination text not null,
  price numeric not null,
  stops text,
  created_at timestamp with time zone default now()
);

create table if not exists public.transport_schedules (
  id bigserial primary key,
  route_id bigint not null references public.transport_routes(id) on delete cascade,
  depart_time time without time zone default '00:00',
  status text not null default 'Active' check (status in ('Active','Delayed','Canceled')),
  created_at timestamp with time zone default now()
);

alter table public.transport_routes enable row level security;
alter table public.transport_schedules enable row level security;

drop policy if exists "Admins can manage transport routes" on public.transport_routes;
create policy "Admins can manage transport routes" on public.transport_routes
  for all
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can manage transport schedules" on public.transport_schedules;
create policy "Admins can manage transport schedules" on public.transport_schedules
  for all
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

create index if not exists idx_transport_routes_created_at on public.transport_routes(created_at);
create index if not exists idx_transport_schedules_route_id on public.transport_schedules(route_id);
create index if not exists idx_transport_schedules_created_at on public.transport_schedules(created_at);
