-- Harden access: prevent any direct SELECT on exam_questions by non-privileged roles
REVOKE SELECT ON TABLE public.exam_questions FROM anon, authenticated;

-- Ensure no legacy student SELECT policy remains (idempotent)
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

-- Note: Students should fetch questions only via SECURITY DEFINER RPCs:
--   get_exam_questions_for_attempt (no correct_answer)
--   get_exam_questions_for_review (includes correct_answer AFTER submission)
-- This migration enforces least-privilege and removes any alternate data paths.