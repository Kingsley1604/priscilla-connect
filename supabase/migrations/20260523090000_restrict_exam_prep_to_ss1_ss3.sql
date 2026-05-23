-- Exam Prep must be available only to senior secondary students (SS1-SS3).
-- The checked-in schema stores student class as profiles.class_grade, not students.grade_level.

create or replace function public.is_exam_prep_eligible(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  with profile_values as (
    select lower(regexp_replace(coalesce(p.class_grade, ''), '[\s_\-./]+', '', 'g')) as grade_name
    from public.profiles p
    where p.id = _user_id
  )
  select exists (
    select 1
    from profile_values p
    join public.profiles pr on pr.id = _user_id
    where lower(coalesce(pr.sector, '')) = 'secondary'
      and exists (
        select 1
        from public.user_roles ur
        where ur.user_id = _user_id
          and ur.role::text = 'student'
      )
      and (
        p.grade_name in (
          'ss1', 'ss2', 'ss3',
          'sss1', 'sss2', 'sss3',
          'senior1', 'senior2', 'senior3',
          'seniorsecondary1', 'seniorsecondary2', 'seniorsecondary3'
        )
        or p.grade_name ~ '^(sss?|seniorsecondary|senior)[123]'
      )
  );
$func$;

-- Demo@SecStudent2025 is the demo secondary student's password in source.
-- The demo email seeded by setup-demo-users is demo.secondary.student@priscilla.edu.
update public.profiles p
set class_grade = 'SS1',
    sector = coalesce(p.sector, 'secondary')
from auth.users u
where u.id = p.id
  and lower(u.email) in (
    'demo.secondary.student@priscilla.edu',
    'demo@secstudent2025'
  )
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p.id
      and ur.role::text = 'student'
  )
  and lower(regexp_replace(coalesce(p.class_grade, ''), '[\s_\-./]+', '', 'g')) not in (
    'ss1', 'ss2', 'ss3',
    'sss1', 'sss2', 'sss3',
    'senior1', 'senior2', 'senior3',
    'seniorsecondary1', 'seniorsecondary2', 'seniorsecondary3'
  );

notify pgrst, 'reload schema';
