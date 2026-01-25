-- გაუშვით ეს ბრძანებები Supabase Studio → SQL-ში (ერთხელ)

-- ჩართე RLS
alter table if exists public.obituaries enable row level security;
alter table if exists public.lost_found enable row level security;
alter table if exists public.masters enable row level security;
alter table if exists public.master_ratings enable row level security;
alter table if exists public.master_portfolio enable row level security;

-- უსაფრთხო დამატება: თუ is_approved არ არსებობს, დავამატოთ (robust setup)
alter table if exists public.obituaries add column if not exists is_approved boolean default false;
alter table if exists public.lost_found add column if not exists is_approved boolean default false;
alter table if exists public.masters add column if not exists is_approved boolean default false;

-- Drop existing policies safely (idempotent runs)
drop policy if exists "Public can view approved obituaries" on public.obituaries;
drop policy if exists "Anyone can submit obituaries" on public.obituaries;
drop policy if exists "Admin can manage obituaries" on public.obituaries;

drop policy if exists "Public can view approved lost_found" on public.lost_found;
drop policy if exists "Anyone can submit lost_found" on public.lost_found;
drop policy if exists "Admin can manage lost_found" on public.lost_found;

drop policy if exists "Public can view approved masters" on public.masters;
drop policy if exists "Anyone can submit masters" on public.masters;
drop policy if exists "Admin can manage masters" on public.masters;

drop policy if exists "Anyone can view ratings" on public.master_ratings;
drop policy if exists "Anyone can add rating" on public.master_ratings;
drop policy if exists "Admin can manage ratings" on public.master_ratings;

drop policy if exists "Anyone can view portfolio" on public.master_portfolio;
drop policy if exists "Admin can manage portfolio" on public.master_portfolio;

-- Obituaries
create policy "Public can view approved obituaries" on public.obituaries
for select using (is_approved = true);

create policy "Anyone can submit obituaries" on public.obituaries
for insert with check (true);

create policy "Admin can manage obituaries" on public.obituaries
for all using (
  EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
      u.raw_user_meta_data->> 'role' = 'admin'
      OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_user_meta_data->> 'is_admin' = 'true'
      OR u.raw_app_meta_data->> 'role' = 'admin'
      OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_app_meta_data->> 'is_admin' = 'true'
    )
  )
);

-- Lost & Found
create policy "Public can view approved lost_found" on public.lost_found
for select using (is_approved = true);

create policy "Anyone can submit lost_found" on public.lost_found
for insert with check (true);

create policy "Admin can manage lost_found" on public.lost_found
for all using (
  EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
      u.raw_user_meta_data->> 'role' = 'admin'
      OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_user_meta_data->> 'is_admin' = 'true'
      OR u.raw_app_meta_data->> 'role' = 'admin'
      OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_app_meta_data->> 'is_admin' = 'true'
    )
  )
);

-- Masters
create policy "Public can view approved masters" on public.masters
for select using (is_approved = true);

create policy "Anyone can submit masters" on public.masters
for insert with check (true);

create policy "Anyone can update master ratings" on public.masters
for update using (true)
with check (
  -- Only allow updates to rating fields
  (OLD.rating_avg IS DISTINCT FROM NEW.rating_avg OR OLD.ratings_count IS DISTINCT FROM NEW.ratings_count)
  AND OLD.id = NEW.id
  AND OLD.full_name = NEW.full_name
  AND OLD.profession = NEW.profession
  AND OLD.phone = NEW.phone
  AND OLD.location = NEW.location
  AND OLD.description = NEW.description
  AND OLD.is_approved = NEW.is_approved
  AND OLD.created_at = NEW.created_at
);

create policy "Admin can manage masters" on public.masters
for all using (
  EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND (
      u.raw_user_meta_data->> 'role' = 'admin'
      OR (u.raw_user_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_user_meta_data->> 'is_admin' = 'true'
      OR u.raw_app_meta_data->> 'role' = 'admin'
      OR (u.raw_app_meta_data->'roles')::jsonb ? 'admin'
      OR u.raw_app_meta_data->> 'is_admin' = 'true'
    )
  )
);

-- Ratings (საჯარო კითხვა და დამატება)
create policy "Anyone can view ratings" on public.master_ratings
for select using (true);

create policy "Anyone can add rating" on public.master_ratings
for insert with check (true);

create policy "Admin can manage ratings" on public.master_ratings
for all using (true);

-- Portfolio (საჯარო კითხვა; დამატება/მართვა ადმინს)
create policy "Anyone can view portfolio" on public.master_portfolio
for select using (true);

create policy "Admin can manage portfolio" on public.master_portfolio
for all using (true);

-- ინდექსები წარმადობისთვის
create index if not exists idx_obituaries_is_approved on public.obituaries(is_approved);
create index if not exists idx_lost_found_pub on public.lost_found(is_approved, resolved, expires_at desc, created_at desc);
create index if not exists idx_masters_is_approved on public.masters(is_approved);
create index if not exists idx_masters_rating on public.masters(rating_avg desc, ratings_count desc);
