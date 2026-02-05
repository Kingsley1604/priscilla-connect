-- Task B & C: Create admin_suspension_notifications table for admin to see suspension requests
CREATE TABLE IF NOT EXISTS public.admin_suspension_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES suspension_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  teacher_id UUID NOT NULL,
  teacher_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  is_handled BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.admin_suspension_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all suspension notifications
CREATE POLICY "Admins can view suspension notifications"
ON public.admin_suspension_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Admins can update (mark as read/handled)
CREATE POLICY "Admins can update suspension notifications"
ON public.admin_suspension_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Teachers can insert their own notifications
CREATE POLICY "Teachers can insert suspension notifications"
ON public.admin_suspension_notifications
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Task H: Fix secondary classes - Add more class levels to the classes table
-- Insert default classes for secondary section if they don't exist
INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'JSS 1', 'JSS 1', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'JSS 1');

INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'JSS 2', 'JSS 2', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'JSS 2');

INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'JSS 3', 'JSS 3', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'JSS 3');

INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'SS 1', 'SS 1', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'SS 1');

INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'SS 2', 'SS 2', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'SS 2');

INSERT INTO public.classes (name, class_level, section, academic_session, created_by, is_active)
SELECT 'SS 3', 'SS 3', 'A', '2025/2026', (SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1), true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_level = 'SS 3');

-- Task J & K: Fix RLS for result_upload_notifications to include super admins
DROP POLICY IF EXISTS "Admins can view result upload notifications" ON result_upload_notifications;
CREATE POLICY "Admins can view result upload notifications"
ON public.result_upload_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_super_admin = true
  )
);

-- Task D: Fix RLS for exam_questions - teachers should be able to query their own exam questions
DROP POLICY IF EXISTS "Teachers can manage their exam questions" ON exam_questions;
CREATE POLICY "Teachers can manage their exam questions"
ON public.exam_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.created_by = auth.uid()
  )
);

-- Allow all users to read exam questions for exams they're taking
CREATE POLICY "Users can read exam questions for active exams"
ON public.exam_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.status = 'active'
  )
);

-- Task E: Ensure exam delete is restricted to creator only
DROP POLICY IF EXISTS "Teachers can manage their exams" ON exams;
CREATE POLICY "Teachers can manage their exams"
ON public.exams
FOR ALL
USING (created_by = auth.uid());

-- Allow all teachers to view exams
CREATE POLICY "Teachers can view all exams"
ON public.exams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('teacher', 'admin')
  )
);