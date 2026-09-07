-- Persist AI-generated insights on each report (generated once at upload time).
alter table public.reports
  add column if not exists ai_summary text,
  add column if not exists ai_anomaly text,
  add column if not exists ai_recommendation text;

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
  on public.reports
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update on public.reports to authenticated;
