-- Fix RLS policy for user_roles to allow users to insert their own student role during signup
DROP POLICY IF EXISTS "Users can insert their own student role" ON public.user_roles;

CREATE POLICY "Users can insert their own student role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'student'::app_role
);

-- Also allow admins to view all roles for management purposes
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);