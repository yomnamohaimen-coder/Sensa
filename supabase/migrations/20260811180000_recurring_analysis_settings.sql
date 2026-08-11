-- Recurring analysis preference (total days; null = manually only) and last auto-report timestamp.
alter table public.profiles
  add column if not exists analysis_interval_days integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_analysis_interval_days_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_analysis_interval_days_check
      check (
        analysis_interval_days is null
        or analysis_interval_days >= 1
      );
  end if;
end $$;

alter table public.profiles
  add column if not exists last_auto_report_at timestamptz;

-- Allow owners to attach unbundled tracking events to a new report.
drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events"
  on public.events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update on public.events to authenticated;

-- Speed up lookups of unbundled tracking events for recurring analysis.
create index if not exists events_unbundled_tracking_idx
  on public.events (user_id, created_at)
  where source = 'tracking_script' and report_id is null;
