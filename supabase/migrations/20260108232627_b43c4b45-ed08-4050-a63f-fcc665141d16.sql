-- Fix the overly permissive user_roles insert policy
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;

-- Create a more restrictive policy for inserting roles
-- Only admins can assign roles, and the handle_new_user trigger (which is SECURITY DEFINER) can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can manually insert roles
  has_role(auth.uid(), 'admin')
);

-- Also need policy for the trigger to work (via service role)
-- The trigger uses SECURITY DEFINER so it bypasses RLS