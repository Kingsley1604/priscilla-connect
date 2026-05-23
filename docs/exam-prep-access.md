# Exam Prep Access Rule

Exam Prep is restricted to senior secondary students only: SS1, SS2, and SS3.

The live schema stores the student level in `profiles.class_grade`, not `students.grade_level`.
The role check comes from `user_roles.role`.

Equivalent policy logic:

```sql
exists (
  select 1
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  where p.id = auth.uid()
    and ur.role::text = 'student'
    and lower(regexp_replace(coalesce(p.class_grade, ''), '[\s_\-./]+', '', 'g')) in (
      'ss1', 'ss2', 'ss3',
      'sss1', 'sss2', 'sss3',
      'senior1', 'senior2', 'senior3',
      'seniorsecondary1', 'seniorsecondary2', 'seniorsecondary3'
    )
)
```

Equivalent API logic:

```ts
const seniorLevels = ['ss1', 'ss2', 'ss3', 'sss1', 'sss2', 'sss3'];
const normalizedGrade = String(user.class_grade || '').toLowerCase().replace(/[\s_\-./]+/g, '');

if (user.role === 'student' && seniorLevels.includes(normalizedGrade)) {
  grantAccess();
} else {
  throw new Error('Access restricted to senior students only');
}
```

Demo account note:

`Demo@SecStudent2025` is the password in source. The seeded demo email is
`demo.secondary.student@priscilla.edu`, and it must have `profiles.class_grade = 'SS1'.`
