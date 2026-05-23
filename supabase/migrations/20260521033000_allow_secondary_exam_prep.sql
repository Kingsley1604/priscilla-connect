-- Allow all secondary students to use Exam Prep.
-- Student signup stores the selected school section in profiles.sector,
-- and new students may not have class_grade assigned yet.

create or replace function public.is_exam_prep_eligible(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  with profile_values as (
    select
      lower(regexp_replace(coalesce(sector, ''), '[\s_\-./]+', '', 'g')) as sector_name,
      lower(regexp_replace(coalesce(class_grade, ''), '[\s_\-./]+', '', 'g')) as grade_name
    from public.profiles
    where id = _user_id
  )
  select exists (
    select 1
    from profile_values
    where exists (
        select 1
        from public.user_roles ur
        where ur.user_id = _user_id
          and ur.role::text = 'student'
      )
      and (
        sector_name in ('secondary', 'junior', 'juniorsecondary', 'jss', 'senior', 'seniorsecondary', 'sss')
        or sector_name like 'secondary%'
        or sector_name like 'juniorsecondary%'
        or sector_name like 'seniorsecondary%'
        or grade_name in ('secondary', 'juniorsecondary', 'seniorsecondary', 'jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3', 'sss1', 'sss2', 'sss3')
        or grade_name ~ '^(jss|juniorsecondary|junior|sss?|seniorsecondary|senior)[123]'
      )
  );
$func$;

notify pgrst, 'reload schema';
