-- Drop and recreate the handle_new_user function to respect the role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_role app_role;
BEGIN
  -- Get the role from user metadata, default to 'student' if not specified
  signup_role := COALESCE(
    (new.raw_user_meta_data->>'role')::app_role,
    'student'::app_role
  );

  -- Insert profile for new user
  INSERT INTO public.profiles (id, name, department, is_profile_complete)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'department',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    department = COALESCE(EXCLUDED.department, profiles.department);

  -- Insert user role based on signup metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, signup_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

-- Fix the current user's role from student to admin
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'febdd3e5-66bd-45ef-8298-d5021ecb4ac4';

-- Create demo accounts for testing
-- First, we need to insert into auth.users which requires service role
-- Instead, we'll create a simple demo users setup

-- Delete any existing demo roles first to avoid conflicts
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN (
    'demo.student@priscilla.edu',
    'demo.teacher@priscilla.edu', 
    'demo.admin@priscilla.edu'
  )
);

-- Delete any existing demo profiles
DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email IN (
    'demo.student@priscilla.edu',
    'demo.teacher@priscilla.edu',
    'demo.admin@priscilla.edu'
  )
);