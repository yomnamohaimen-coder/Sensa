-- Cached AI summaries for session recordings, one row per (tracking_id, session_id).
-- Regenerated when the underlying tracking_script event count for that session changes.

create table if not exists public.session_recording_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tracking_id uuid not null references public.profiles (tracking_id) on delete cascade,
  session_id text not null,
  summary text not null,
  source_event_count integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_recording_summaries_event_count_check
    check (source_event_count >= 0),
  constraint session_recording_summaries_tracking_id_session_id_key
    unique (tracking_id, session_id)
);

create index if not exists session_recording_summaries_user_id_idx
  on public.session_recording_summaries (user_id);

alter table public.session_recording_summaries enable row level security;

drop policy if exists "Users can read own session recording summaries"
  on public.session_recording_summaries;
create policy "Users can read own session recording summaries"
  on public.session_recording_summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own session recording summaries"
  on public.session_recording_summaries;
create policy "Users can insert own session recording summaries"
  on public.session_recording_summaries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own session recording summaries"
  on public.session_recording_summaries;
create policy "Users can update own session recording summaries"
  on public.session_recording_summaries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.session_recording_summaries to authenticated;
