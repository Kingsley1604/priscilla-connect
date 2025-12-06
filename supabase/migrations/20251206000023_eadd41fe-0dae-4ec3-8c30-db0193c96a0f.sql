-- Drop existing restrictive policy and create a proper one for student signup
DROP POLICY IF EXISTS "Users can insert their own student role" ON public.user_roles;

-- Create a more permissive policy that allows new users to insert their student role
CREATE POLICY "New users can insert their own student role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'student'::app_role
);

-- Also ensure profiles table allows inserts for new users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());