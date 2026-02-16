
-- Drop all existing restrictive policies on exam_questions
DROP POLICY IF EXISTS "Admins can view all exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Teachers can manage their exam questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Users can read exam questions for active exams" ON public.exam_questions;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view all exam questions"
ON public.exam_questions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage their exam questions"
ON public.exam_questions FOR ALL
USING (EXISTS (
  SELECT 1 FROM exams e
  WHERE e.id = exam_questions.exam_id AND e.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM exams e
  WHERE e.id = exam_questions.exam_id AND e.created_by = auth.uid()
));

CREATE POLICY "Users can read exam questions for active exams"
ON public.exam_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM exams
  WHERE exams.id = exam_questions.exam_id AND exams.status = 'active'::exam_status
));
