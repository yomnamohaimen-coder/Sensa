-- Onboarding answer fields on profiles.
alter table public.profiles
  add column product_name text,
  add column industry text,
  add column focus_areas text[],
  add column team_size text;

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);
