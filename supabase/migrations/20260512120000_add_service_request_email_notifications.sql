alter table public.masters
  add column if not exists email text,
  add column if not exists notify_by_email boolean not null default false;

create table if not exists public.service_request_notification_logs (
  id uuid default gen_random_uuid() primary key,
  service_request_id uuid references public.announcements(id) on delete cascade,
  provider_id uuid references public.masters(id) on delete set null,
  email text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamp with time zone default now()
);

create unique index if not exists service_request_notification_logs_unique_provider
  on public.service_request_notification_logs(service_request_id, provider_id)
  where provider_id is not null;

alter table public.service_request_notification_logs enable row level security;

notify pgrst, 'reload schema';
