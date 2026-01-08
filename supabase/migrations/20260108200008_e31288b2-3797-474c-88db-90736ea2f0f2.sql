-- Task L: Set super admin for the given email
-- First create a secondary demo student user
DO $$
DECLARE
  super_admin_id uuid;
BEGIN
  -- Find user with the super admin email and set is_super_admin = true
  UPDATE public.profiles
  SET is_super_admin = true
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'abelkingsley2k04@gmail.com'
  );
  
  -- Ensure only ONE super admin exists - reset all others
  UPDATE public.profiles
  SET is_super_admin = false
  WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email = 'abelkingsley2k04@gmail.com'
  )
  AND is_super_admin = true;
END $$;

-- Task F: Create secondary demo student for testing
-- The edge function will handle actual user creation