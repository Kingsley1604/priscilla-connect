-- Fix RLS policies to use secure has_role() function instead of raw_user_meta_data
-- This prevents privilege escalation by ensuring roles are checked via the user_roles table

-- ============================================
-- EXAM_ATTEMPTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.exam_attempts;
CREATE POLICY "Admins can view all attempts"
ON public.exam_attempts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- REPORT_CARDS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all report cards" ON public.report_cards;
CREATE POLICY "Admins can manage all report cards"
ON public.report_cards
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can create report cards" ON public.report_cards;
CREATE POLICY "Teachers can create report cards"
ON public.report_cards
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
  AND EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    WHERE ta.teacher_id = auth.uid()
      AND ta.class_level = report_cards.class_level
      AND ta.is_active = true
  )
);

DROP POLICY IF EXISTS "Teachers can view report cards they created" ON public.report_cards;
CREATE POLICY "Teachers can view report cards they created"
ON public.report_cards
FOR SELECT
USING (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
);

DROP POLICY IF EXISTS "Teachers can update report cards they created" ON public.report_cards;
CREATE POLICY "Teachers can update report cards they created"
ON public.report_cards
FOR UPDATE
USING (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
)
WITH CHECK (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
);

DROP POLICY IF EXISTS "Teachers can delete report cards they created" ON public.report_cards;
CREATE POLICY "Teachers can delete report cards they created"
ON public.report_cards
FOR DELETE
USING (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
);

-- ============================================
-- INVENTORY_ALERTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all inventory alerts" ON public.inventory_alerts;
CREATE POLICY "Admins can manage all inventory alerts"
ON public.inventory_alerts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view inventory alerts" ON public.inventory_alerts;
CREATE POLICY "Admins can view inventory alerts"
ON public.inventory_alerts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EXAMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view all exams" ON public.exams;
CREATE POLICY "Admins can view all exams"
ON public.exams
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TEACHER_ASSIGNMENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all teacher assignments" ON public.teacher_assignments;
CREATE POLICY "Admins can manage all teacher assignments"
ON public.teacher_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- HOMEWORK TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all homework" ON public.homework;
CREATE POLICY "Admins can manage all homework"
ON public.homework
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can manage their homework" ON public.homework;
CREATE POLICY "Teachers can manage their homework"
ON public.homework
FOR ALL
USING (
  auth.uid() = created_by
  AND public.has_role(auth.uid(), 'teacher')
);

-- ============================================
-- STUDENT_RESULTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all results" ON public.student_results;
CREATE POLICY "Admins can manage all results"
ON public.student_results
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Teachers can manage their results" ON public.student_results;
CREATE POLICY "Teachers can manage their results"
ON public.student_results
FOR ALL
USING (
  created_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
);

-- ============================================
-- RESULT_CODES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all result codes" ON public.result_codes;
CREATE POLICY "Admins can manage all result codes"
ON public.result_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- HOMEWORK_SUBMISSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.homework_submissions;
CREATE POLICY "Admins can manage all submissions"
ON public.homework_submissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VIDEO_CONTENT TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all videos" ON public.video_content;
CREATE POLICY "Admins can manage all videos"
ON public.video_content
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EXAM_RESULTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all results" ON public.exam_results;
CREATE POLICY "Admins can manage all results"
ON public.exam_results
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can create and view their own events" ON public.events;
CREATE POLICY "Students can create and view their own events"
ON public.events
FOR ALL
USING (
  auth.uid() = created_by
  AND public.has_role(auth.uid(), 'student')
);

DROP POLICY IF EXISTS "Students can view approved events" ON public.events;
CREATE POLICY "Students can view approved events"
ON public.events
FOR SELECT
USING (
  status = 'approved'
  AND public.has_role(auth.uid(), 'student')
);

DROP POLICY IF EXISTS "Teachers can create and view their own events" ON public.events;
CREATE POLICY "Teachers can create and view their own events"
ON public.events
FOR ALL
USING (
  auth.uid() = created_by
  AND public.has_role(auth.uid(), 'teacher')
);

DROP POLICY IF EXISTS "Teachers can view approved admin events" ON public.events;
CREATE POLICY "Teachers can view approved admin events"
ON public.events
FOR SELECT
USING (
  status = 'approved'
  AND created_by IN (
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  )
  AND public.has_role(auth.uid(), 'teacher')
);

-- ============================================
-- EXAM_TOKENS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all tokens" ON public.exam_tokens;
CREATE POLICY "Admins can manage all tokens"
ON public.exam_tokens
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STORE_ITEMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all store items" ON public.store_items;
CREATE POLICY "Admins can manage all store items"
ON public.store_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ADMIN_NOTIFICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can update their notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update their notifications"
ON public.admin_notifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));