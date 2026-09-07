-- Page screenshots for heatmap backgrounds, scoped per connected site (tracking_id).
-- Unique on (tracking_id, page) so identically named paths from different tenants never collide.

create table if not exists public.page_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tracking_id uuid not null references public.profiles (tracking_id) on delete cascade,
  page text not null,
  image_url text not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now(),
  constraint page_snapshots_width_check check (width > 0),
  constraint page_snapshots_height_check check (height > 0),
  constraint page_snapshots_tracking_id_page_key unique (tracking_id, page)
);

create index if not exists page_snapshots_user_id_idx
  on public.page_snapshots (user_id);

create index if not exists page_snapshots_tracking_id_idx
  on public.page_snapshots (tracking_id);

alter table public.page_snapshots enable row level security;

drop policy if exists "Users can read own page snapshots" on public.page_snapshots;
create policy "Users can read own page snapshots"
  on public.page_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own page snapshots" on public.page_snapshots;
create policy "Users can insert own page snapshots"
  on public.page_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own page snapshots" on public.page_snapshots;
create policy "Users can update own page snapshots"
  on public.page_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own page snapshots" on public.page_snapshots;
create policy "Users can delete own page snapshots"
  on public.page_snapshots
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.page_snapshots to authenticated;

-- Public-read Storage bucket for heatmap screenshot files.
-- Object path convention: {tracking_id}/{page-slug}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'page-snapshots',
  'page-snapshots',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read so Reports can display image_url directly.
drop policy if exists "Public read page-snapshots" on storage.objects;
create policy "Public read page-snapshots"
  on storage.objects
  for select
  to public
  using (bucket_id = 'page-snapshots');

-- Authenticated writes limited to that user's own tracking_id folder.
drop policy if exists "Users upload own page-snapshots" on storage.objects;
create policy "Users upload own page-snapshots"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'page-snapshots'
    and (storage.foldername(name))[1] = (
      select p.tracking_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "Users update own page-snapshots" on storage.objects;
create policy "Users update own page-snapshots"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'page-snapshots'
    and (storage.foldername(name))[1] = (
      select p.tracking_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
  )
  with check (
    bucket_id = 'page-snapshots'
    and (storage.foldername(name))[1] = (
      select p.tracking_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "Users delete own page-snapshots" on storage.objects;
create policy "Users delete own page-snapshots"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'page-snapshots'
    and (storage.foldername(name))[1] = (
      select p.tracking_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
  );
