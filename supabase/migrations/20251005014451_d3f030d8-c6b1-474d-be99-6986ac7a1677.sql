-- Fix RLS policies for security issues (excluding exam_statistics view)

-- Fix exam_attempts - restrict student permissions
DROP POLICY IF EXISTS "Students can manage their own attempts" ON public.exam_attempts;

CREATE POLICY "Students can view their own attempts"
ON public.exam_attempts
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own attempts"
ON public.exam_attempts
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update only non-submitted attempts"
ON public.exam_attempts
FOR UPDATE
USING (
  student_id = auth.uid()
  AND submitted_at IS NULL
)
WITH CHECK (
  student_id = auth.uid()
  AND submitted_at IS NULL
);

-- Fix store_orders - add order ID protection
DROP POLICY IF EXISTS "Users can view their own orders" ON public.store_orders;

CREATE POLICY "Users can view only their own orders"
ON public.store_orders
FOR SELECT
USING (
  user_id = auth.uid()
);

-- Fix report_cards - separate read/write permissions for teachers
DROP POLICY IF EXISTS "Teachers can create and manage report cards" ON public.report_cards;

CREATE POLICY "Teachers can view report cards they created"
ON public.report_cards
FOR SELECT
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND (users.raw_user_meta_data->>'role')::text = 'teacher'
  )
);

CREATE POLICY "Teachers can create report cards"
ON public.report_cards
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND (users.raw_user_meta_data->>'role')::text = 'teacher'
  )
);

CREATE POLICY "Teachers can update report cards they created"
ON public.report_cards
FOR UPDATE
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND (users.raw_user_meta_data->>'role')::text = 'teacher'
  )
)
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND (users.raw_user_meta_data->>'role')::text = 'teacher'
  )
);

CREATE POLICY "Teachers can delete report cards they created"
ON public.report_cards
FOR DELETE
USING (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND (users.raw_user_meta_data->>'role')::text = 'teacher'
  )
);