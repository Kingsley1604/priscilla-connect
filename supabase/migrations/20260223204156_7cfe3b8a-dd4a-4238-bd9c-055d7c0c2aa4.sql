
-- Missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_id TEXT;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Fix secondary_report_subjects - add total_score as regular column (drop generated)
ALTER TABLE public.secondary_report_subjects DROP COLUMN IF EXISTS total_score;
ALTER TABLE public.secondary_report_subjects ADD COLUMN total_score NUMERIC DEFAULT 0;

-- search_teachers function
CREATE OR REPLACE FUNCTION public.search_teachers(search_term TEXT)
RETURNS TABLE (id UUID, name TEXT, email TEXT, sector TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.sector
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'teacher'
  AND (search_term = '' OR p.name ILIKE '%' || search_term || '%' OR p.email ILIKE '%' || search_term || '%');
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_teachers(TEXT) TO authenticated;

-- Fix the 2 function search_path warnings
CREATE OR REPLACE FUNCTION public.get_exam_question_count(p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count
  FROM public.exam_questions eq
  WHERE eq.exam_id = p_exam_id;
  RETURN question_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_exam_questions_for_attempt(p_exam_attempt_id UUID)
RETURNS TABLE (id UUID, question_text TEXT, option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT, question_order INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT eq.id, eq.question_text, eq.option_a, eq.option_b, eq.option_c, eq.option_d, eq.question_order
  FROM public.exam_questions eq
  JOIN public.exam_attempts ea ON ea.exam_id = eq.exam_id
  WHERE ea.id = p_exam_attempt_id
  ORDER BY eq.question_order;
END;
$$;
