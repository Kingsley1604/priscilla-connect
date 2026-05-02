-- Fix: profiles primary key is `id` (not `user_id`).
create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_super_admin from public.profiles where id = _user_id), false);
$$;

-- Track import jobs so the SA panel can show "last import" status.
create table if not exists public.past_questions_import_jobs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  total_inserted integer default 0,
  notes text
);

alter table public.past_questions_import_jobs enable row level security;

drop policy if exists "import jobs readable by super admin" on public.past_questions_import_jobs;
create policy "import jobs readable by super admin"
  on public.past_questions_import_jobs for select
  to authenticated
  using (public.is_super_admin(auth.uid()));

drop policy if exists "import jobs writable by super admin" on public.past_questions_import_jobs;
create policy "import jobs writable by super admin"
  on public.past_questions_import_jobs for all
  to authenticated
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- Helper: is this user an SS1-SS3 student (eligible for Exam Prep)?
create or replace function public.is_exam_prep_eligible(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = _user_id
      and lower(coalesce(p.sector, '')) = 'secondary'
      and lower(replace(coalesce(p.class_grade, ''), ' ', '')) in ('ss1','ss2','ss3')
  );
$$;

-- Lock down past_questions reads to eligible students + staff (admins/teachers/super admins).
do $$ begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='past_questions') then
    execute 'alter table public.past_questions enable row level security';
  end if;
end $$;

drop policy if exists "past questions readable by all" on public.past_questions;
drop policy if exists "past questions readable" on public.past_questions;
drop policy if exists "Authenticated can read past questions" on public.past_questions;
create policy "past questions readable"
  on public.past_questions for select
  to authenticated
  using (
    public.is_super_admin(auth.uid())
    or public.is_exam_prep_eligible(auth.uid())
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','teacher')
    )
  );
