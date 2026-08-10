-- Unique per-account tracking ID for the public ingestion endpoint.
alter table public.profiles
  add column if not exists tracking_id uuid not null default gen_random_uuid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_tracking_id_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_tracking_id_key unique (tracking_id);
  end if;
end $$;

-- Live-tracked events can exist before they are bundled into a report.
alter table public.events
  alter column report_id drop not null;

-- Source lives on events so tracking_script rows can be labeled without a report.
alter table public.events
  add column if not exists source text not null default 'manual_upload';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_source_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_source_check
      check (source in ('manual_upload', 'tracking_script'));
  end if;
end $$;

create index if not exists events_user_id_source_idx
  on public.events (user_id, source);
