-- Fix announcements RLS policies to avoid users table access
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Students and teachers can view active announcements" ON public.announcements;

-- Create improved RLS policies
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (is_active = true);

-- Add unique constraint to prevent duplicate academic sessions
ALTER TABLE public.report_cards
DROP CONSTRAINT IF EXISTS unique_student_session_term;

ALTER TABLE public.report_cards
ADD CONSTRAINT unique_student_session_term 
UNIQUE (student_id, academic_session, term, class_level);

-- Create index for better performance on announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active_roles 
ON public.announcements(is_active, target_roles);

-- Create index for report cards lookup
CREATE INDEX IF NOT EXISTS idx_report_cards_student_session 
ON public.report_cards(student_id, academic_session, term);
