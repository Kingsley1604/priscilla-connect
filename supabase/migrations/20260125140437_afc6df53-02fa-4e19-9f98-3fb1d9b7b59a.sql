-- Task B & D: Fix RLS policy for report_cards table to allow teachers to submit reports
-- Drop existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Teachers can create report cards" ON public.report_cards;

-- Create a more permissive INSERT policy for teachers
CREATE POLICY "Teachers can create report cards"
ON public.report_cards
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND 
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Task C: Fix RLS policy for class_students table to allow teachers to add students
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.class_students;

CREATE POLICY "Teachers can manage students in their classes"
ON public.class_students
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id
    AND c.class_teacher_id = auth.uid()
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'teacher'::app_role) AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id
    AND c.class_teacher_id = auth.uid()
  ))
);