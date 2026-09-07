-- Reports: one analysis run per upload or future automated ingestion batch.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'completed',
  source text not null default 'manual_upload',
  source_filename text,
  constraint reports_status_check check (
    status in ('pending', 'processing', 'completed', 'failed')
  )
);

-- Events: canonical schema shared by manual upload and future tracking script.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  event_type text not null,
  timestamp timestamptz not null,
  page text not null,
  device text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_report_id_idx on public.events (report_id);
create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_session_id_idx on public.events (session_id);
create index if not exists reports_user_id_created_at_idx on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;
alter table public.events enable row level security;

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own events" on public.events;
create policy "Users can read own events"
  on public.events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own events" on public.events;
create policy "Users can insert own events"
  on public.events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.reports to authenticated;
grant select, insert on public.events to authenticated;
