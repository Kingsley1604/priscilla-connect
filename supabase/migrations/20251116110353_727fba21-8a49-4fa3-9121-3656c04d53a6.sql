-- Fix critical security issues in RLS policies (corrected version)

-- 1. Fix exam_tokens policy - students should only see their own assigned tokens
DROP POLICY IF EXISTS "Students can use their own tokens" ON public.exam_tokens;
CREATE POLICY "Students can use their own tokens"
ON public.exam_tokens
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- 2. Note: exam_statistics is a VIEW, not a table, so RLS doesn't apply
-- Security is handled by the underlying tables (exams, exam_attempts)

-- 3. Fix report_cards - add validation to ensure teachers can only create reports for their assigned students
DROP POLICY IF EXISTS "Teachers can create report cards" ON public.report_cards;
CREATE POLICY "Teachers can create report cards"
ON public.report_cards
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.raw_user_meta_data->>'role' = 'teacher'
  )
  AND EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    WHERE ta.teacher_id = auth.uid()
    AND ta.class_level = report_cards.class_level
    AND ta.is_active = true
  )
);

-- 4. Add inventory alerts SELECT policy for admins only
CREATE POLICY "Admins can view inventory alerts"
ON public.inventory_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 5. Add teacher search function to help with auto-assignment
CREATE OR REPLACE FUNCTION public.search_teachers(search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as name,
    u.email
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'role' = 'teacher'
  AND (
    u.email ILIKE '%' || search_term || '%'
    OR u.raw_user_meta_data->>'name' ILIKE '%' || search_term || '%'
  )
  LIMIT 20;
$$;