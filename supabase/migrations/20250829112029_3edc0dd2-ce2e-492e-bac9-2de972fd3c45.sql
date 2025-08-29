-- Drop the views that failed
DROP VIEW IF EXISTS public.exam_questions_student;
DROP VIEW IF EXISTS public.exam_questions_review;

-- Create a security definer function to get questions without correct answers for active attempts
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_attempt(exam_attempt_id uuid)
RETURNS TABLE (
  id uuid,
  exam_id uuid,
  question_order integer,
  created_at timestamptz,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    eq.id,
    eq.exam_id,
    eq.question_order,
    eq.created_at,
    eq.question_text,
    eq.option_a,
    eq.option_b,
    eq.option_c,
    eq.option_d
  FROM public.exam_questions eq
  JOIN public.exam_attempts ea ON ea.exam_id = eq.exam_id
  WHERE ea.id = exam_attempt_id
    AND ea.student_id = auth.uid()
    AND ea.submitted_at IS NULL
  ORDER BY eq.question_order;
$$;

-- Create a function to get questions with correct answers for review (after submission)
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_review(exam_attempt_id uuid)
RETURNS TABLE (
  id uuid,
  exam_id uuid,
  question_order integer,
  created_at timestamptz,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer char
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    eq.id,
    eq.exam_id,
    eq.question_order,
    eq.created_at,
    eq.question_text,
    eq.option_a,
    eq.option_b,
    eq.option_c,
    eq.option_d,
    eq.correct_answer
  FROM public.exam_questions eq
  JOIN public.exam_attempts ea ON ea.exam_id = eq.exam_id
  WHERE ea.id = exam_attempt_id
    AND ea.student_id = auth.uid()
    AND ea.submitted_at IS NOT NULL
  ORDER BY eq.question_order;
$$;

-- Re-add the student policy but make it more restrictive
-- Students should NOT be able to directly query exam_questions table
-- They must use the security definer functions above

-- Keep existing policies for teachers and admins who need full access
-- Teachers can manage questions for their exams (this policy already exists)
-- Admins can view all questions (policy should already exist)