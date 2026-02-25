
-- SECURITY FIX: Tighten suspension_requests visibility for teachers
DROP POLICY IF EXISTS "Teachers can create and view their suspension requests" ON public.suspension_requests;

CREATE POLICY "Teachers can view their own suspension requests" ON public.suspension_requests
  FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "Teachers can create suspension requests" ON public.suspension_requests
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- SECURITY FIX: Add DELETE policy for old call history
CREATE POLICY "Users can delete old call history" ON public.call_history
  FOR DELETE
  USING (
    (auth.uid() = caller_id OR auth.uid() = receiver_id)
    AND created_at < now() - interval '90 days'
  );
