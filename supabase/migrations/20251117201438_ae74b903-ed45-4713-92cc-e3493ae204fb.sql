-- Fix security issues

-- 1. Drop the exam_statistics view and replace with a secure function
DROP VIEW IF EXISTS public.exam_statistics;

-- Create a function instead of a view to avoid SECURITY DEFINER issues
CREATE OR REPLACE FUNCTION public.get_exam_statistics(creator_id uuid DEFAULT NULL)
RETURNS TABLE (
  exam_id uuid,
  title text,
  created_by uuid,
  students_taking bigint,
  students_completed bigint,
  students_not_started bigint,
  total_students bigint
) 
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    e.id as exam_id,
    e.title,
    e.created_by,
    COUNT(CASE WHEN ea.submitted_at IS NULL AND ea.started_at IS NOT NULL THEN 1 END) as students_taking,
    COUNT(CASE WHEN ea.submitted_at IS NOT NULL THEN 1 END) as students_completed,
    COUNT(CASE WHEN ea.student_id IS NOT NULL THEN 1 END) - COUNT(CASE WHEN ea.started_at IS NOT NULL THEN 1 END) as students_not_started,
    COUNT(ea.student_id) as total_students
  FROM public.exams e
  LEFT JOIN public.exam_attempts ea ON e.id = ea.exam_id
  WHERE e.status = 'active'
    AND (creator_id IS NULL OR e.created_by = creator_id)
    AND (creator_id IS NULL OR e.created_by = auth.uid())
  GROUP BY e.id, e.title, e.created_by;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_exam_statistics(uuid) TO authenticated;