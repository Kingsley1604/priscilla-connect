-- Task C & D: Fix RLS policies for class_students and report_cards

-- Drop existing problematic policy for class_students teacher management
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.class_students;

-- Create new policy that allows teachers to manage students in their class
-- The teacher must be the class_teacher_id of the class they're enrolling students into
CREATE POLICY "Teachers can manage students in their classes" 
ON public.class_students 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id 
    AND c.class_teacher_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id 
    AND c.class_teacher_id = auth.uid()
  )
);

-- Task D: Fix report_cards INSERT policy - remove the auth.users check that's failing
DROP POLICY IF EXISTS "Teachers can create report cards" ON public.report_cards;

-- Create a simpler INSERT policy for teachers
-- Just check if they have teacher role and an active assignment for the class
CREATE POLICY "Teachers can create report cards"
ON public.report_cards
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    WHERE ta.teacher_id = auth.uid()
    AND ta.class_level = report_cards.class_level
    AND ta.is_active = true
    AND ta.is_class_teacher = true
  )
);

-- Task G: Add database indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON public.class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_created_by ON public.report_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_report_cards_class_level ON public.report_cards(class_level);
CREATE INDEX IF NOT EXISTS idx_secondary_report_cards_created_by ON public.secondary_report_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_secondary_report_cards_class_level ON public.secondary_report_cards(class_level);
CREATE INDEX IF NOT EXISTS idx_secondary_report_cards_student_id ON public.secondary_report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_grade ON public.profiles(class_grade);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_level ON public.teacher_assignments(class_level);
CREATE INDEX IF NOT EXISTS idx_classes_class_teacher_id ON public.classes(class_teacher_id);