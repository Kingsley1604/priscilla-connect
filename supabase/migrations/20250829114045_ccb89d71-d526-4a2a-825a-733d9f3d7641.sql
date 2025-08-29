-- Remove student direct access to exam_questions and add secure count function

-- Drop the student SELECT policy so students cannot read correct_answer via the table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'exam_questions' 
      AND policyname = 'Students can view questions during active attempts'
  ) THEN
    DROP POLICY "Students can view questions during active attempts" ON public.exam_questions;
  END IF;
END $$;

-- Create a secure function to get question count without exposing table access
CREATE OR REPLACE FUNCTION public.get_exam_question_count(exam_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.exam_questions WHERE exam_id = get_exam_question_count.exam_id;
$$;