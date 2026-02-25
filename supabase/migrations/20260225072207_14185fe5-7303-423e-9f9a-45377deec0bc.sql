
-- Task A: Fix exam_attempts RLS policy that prevents submission
-- The WITH CHECK requires submitted_at IS NULL, but the UPDATE sets submitted_at to a value
DROP POLICY IF EXISTS "Students can update only non-submitted attempts" ON public.exam_attempts;

CREATE POLICY "Students can update their own non-submitted attempts"
ON public.exam_attempts
FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND submitted_at IS NULL)
WITH CHECK (student_id = auth.uid());

-- Task F: Super admin session tracking table and functions
CREATE TABLE IF NOT EXISTS public.super_admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.super_admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can manage their sessions"
ON public.super_admin_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to register a super admin session (invalidates previous ones)
CREATE OR REPLACE FUNCTION public.register_super_admin_session(
  p_session_token text,
  p_device_info text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate all previous sessions for this user
  UPDATE public.super_admin_sessions
  SET is_active = false
  WHERE user_id = auth.uid();

  -- Insert new session
  INSERT INTO public.super_admin_sessions (user_id, session_token, device_info, is_active)
  VALUES (auth.uid(), p_session_token, p_device_info, true);
END;
$$;

-- Function to check if a session is still valid
CREATE OR REPLACE FUNCTION public.check_super_admin_session(
  p_session_token text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admin_sessions
    WHERE session_token = p_session_token
      AND is_active = true
      AND user_id = auth.uid()
  );
$$;
