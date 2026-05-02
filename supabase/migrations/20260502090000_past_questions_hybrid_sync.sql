-- App-wide settings table for controlled feature flags (super-admin-only writes)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

-- Anyone authenticated can read settings (so client knows the data source)
drop policy if exists "settings readable by authenticated" on public.app_settings;
create policy "settings readable by authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

-- Only super admins can insert/update settings
drop policy if exists "settings writable by super admin" on public.app_settings;
create policy "settings writable by super admin"
  on public.app_settings for all
  to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- Default flag: use API (not Supabase) until import completes & SA flips it
insert into public.app_settings (key, value)
values ('past_questions_source', '{"useSupabaseData": false}'::jsonb)
on conflict (key) do nothing;

-- Helpful index for completion check on past_questions
create index if not exists past_questions_exam_subject_idx
  on public.past_questions (exam_type, subject);
