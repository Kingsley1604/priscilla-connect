-- Task A + B fixes: ensure app_settings is reachable, broaden eligibility.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
declare
  result boolean := false;
begin
  begin
    select coalesce(p.is_super_admin, false) into result
    from public.profiles p where p.id = _user_id limit 1;
  exception when undefined_column then result := false;
  end;
  if result then return true; end if;
  begin
    select coalesce(p.is_super_admin, false) into result
    from public.profiles p where p.user_id = _user_id limit 1;
  exception when undefined_column then result := false;
  end;
  return coalesce(result, false);
end;
$func$;

drop policy if exists "settings readable by authenticated" on public.app_settings;
create policy "settings readable by authenticated"
  on public.app_settings for select to authenticated using (true);

drop policy if exists "settings writable by super admin" on public.app_settings;
create policy "settings writable by super admin"
  on public.app_settings for all to authenticated
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

insert into public.app_settings (key, value)
values ('past_questions_source', '{"useSupabaseData": false}'::jsonb)
on conflict (key) do nothing;

create or replace function public.is_exam_prep_eligible(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $func$
  with p as (
    select lower(regexp_replace(coalesce(class_grade, ''), '[\s_\-./]+', '', 'g')) as grd
    from public.profiles where id = _user_id
  )
  select exists (select 1 from p where grd ~ '^(sss?|seniorsecondary|senior)[123]');
$func$;

notify pgrst, 'reload schema';
