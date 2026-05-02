-- App-wide settings table for controlled feature flags (super-admin-only writes)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

-- Helper: is current user a super admin (reads from profiles.is_super_admin)
create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_super_admin from public.profiles where user_id = _user_id), false);
$$;

drop policy if exists "settings readable by authenticated" on public.app_settings;
create policy "settings readable by authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

drop policy if exists "settings writable by super admin" on public.app_settings;
create policy "settings writable by super admin"
  on public.app_settings for all
  to authenticated
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

insert into public.app_settings (key, value)
values ('past_questions_source', '{"useSupabaseData": false}'::jsonb)
on conflict (key) do nothing;

create index if not exists past_questions_exam_subject_idx
  on public.past_questions (exam_type, subject);
