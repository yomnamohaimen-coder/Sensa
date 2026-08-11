-- Migrate fixed-interval text setting to flexible day counts, if present.
alter table public.profiles
  add column if not exists analysis_interval_days integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'analysis_interval'
  ) then
    update public.profiles
    set analysis_interval_days = case analysis_interval
      when 'every_3_days' then 3
      when 'weekly' then 7
      else null
    end
    where analysis_interval_days is null;

    alter table public.profiles
      drop constraint if exists profiles_analysis_interval_check;

    alter table public.profiles
      drop column analysis_interval;
  end if;
end $$;

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
