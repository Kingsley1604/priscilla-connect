-- Task E-G: Allow class teachers to update student class_grade
-- First check if policy exists, if not create it
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Class teachers can update student class assignment" ON public.profiles;
  
  -- Create policy to allow class teachers to update student class_grade
  CREATE POLICY "Class teachers can update student class assignment"
  ON public.profiles
  FOR UPDATE
  USING (
    -- Allow if user is admin
    has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Allow if user is a class teacher updating a student's class_grade
    (
      has_role(auth.uid(), 'teacher'::app_role)
      AND 
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = profiles.id 
        AND ur.role = 'student'::app_role
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR
    (
      has_role(auth.uid(), 'teacher'::app_role)
      AND 
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = profiles.id 
        AND ur.role = 'student'::app_role
      )
    )
  );
END $$;