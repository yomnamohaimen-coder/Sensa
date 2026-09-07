-- Separate toggle so interval days can stay stored while auto-analysis is off.
alter table public.profiles
  add column if not exists analysis_manual_only boolean not null default true;

-- Existing rows with a day interval were previously treated as automatic.
update public.profiles
set analysis_manual_only = false
where analysis_interval_days is not null
  and analysis_manual_only = true
  and analysis_interval_days >= 1;
