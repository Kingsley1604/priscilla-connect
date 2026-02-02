-- Task K & L: Add 'termly' to exam_type enum
ALTER TYPE public.exam_type ADD VALUE IF NOT EXISTS 'termly';

-- Task O: Fix exam_questions RLS - Allow authenticated teachers to insert/update/delete questions for their exams
DROP POLICY IF EXISTS "Teachers can manage questions for their exams" ON public.exam_questions;

CREATE POLICY "Teachers can manage questions for their exams" 
ON public.exam_questions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_questions.exam_id 
    AND e.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_questions.exam_id 
    AND e.created_by = auth.uid()
  )
);

-- Also add policy for admins to view all questions
CREATE POLICY "Admins can view all exam questions" 
ON public.exam_questions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Task A: Add policy for group creator to demote admin
DROP POLICY IF EXISTS "chat_group_members_update" ON public.chat_group_members;

CREATE POLICY "Group creator can update member admin status"
ON public.chat_group_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_groups g
    WHERE g.id = chat_group_members.group_id
    AND g.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_groups g
    WHERE g.id = chat_group_members.group_id
    AND g.created_by = auth.uid()
  )
);