-- Base URL of the connected site, used for server-side page screenshots.
alter table public.profiles
  add column if not exists site_url text;
