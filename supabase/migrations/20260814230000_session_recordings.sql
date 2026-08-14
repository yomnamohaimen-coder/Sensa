-- Session replay chunks (rrweb), scoped per connected site (tracking_id).
-- Anonymous ingestion will use the service role (bypasses RLS), same as /api/track.

create table if not exists public.session_recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tracking_id uuid not null references public.profiles (tracking_id) on delete cascade,
  session_id text not null,
  page text not null,
  rrweb_events jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists session_recordings_tracking_id_session_id_idx
  on public.session_recordings (tracking_id, session_id);

create index if not exists session_recordings_user_id_idx
  on public.session_recordings (user_id);

alter table public.session_recordings enable row level security;

drop policy if exists "Users can read own session recordings" on public.session_recordings;
create policy "Users can read own session recordings"
  on public.session_recordings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own session recordings" on public.session_recordings;
create policy "Users can insert own session recordings"
  on public.session_recordings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own session recordings" on public.session_recordings;
create policy "Users can update own session recordings"
  on public.session_recordings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own session recordings" on public.session_recordings;
create policy "Users can delete own session recordings"
  on public.session_recordings
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.session_recordings to authenticated;
