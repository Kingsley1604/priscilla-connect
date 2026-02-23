
-- Missing RPC functions
CREATE OR REPLACE FUNCTION public.generate_default_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN 'Priscilla' || floor(random() * 9000 + 1000)::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_teacher_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN 'TCH-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 9999 + 1)::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_exam_statistics(p_teacher_id UUID)
RETURNS TABLE (
  exam_id UUID,
  title TEXT,
  students_taking BIGINT,
  students_completed BIGINT,
  students_not_started BIGINT,
  total_students BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as exam_id,
    e.title,
    COUNT(CASE WHEN ea.submitted_at IS NULL AND ea.started_at IS NOT NULL THEN 1 END) as students_taking,
    COUNT(CASE WHEN ea.submitted_at IS NOT NULL THEN 1 END) as students_completed,
    (SELECT COUNT(*) FROM public.exam_tokens et WHERE et.exam_id = e.id AND et.used_at IS NULL) as students_not_started,
    (SELECT COUNT(*) FROM public.exam_tokens et2 WHERE et2.exam_id = e.id) as total_students
  FROM public.exams e
  LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id
  WHERE e.created_by = p_teacher_id AND e.status = 'active'
  GROUP BY e.id, e.title;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_default_password() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_teacher_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_statistics(UUID) TO authenticated;
