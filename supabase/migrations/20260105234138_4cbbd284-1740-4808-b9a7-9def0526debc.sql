-- Task L: Set up super admin for abelkingsley2k04@gmail.com
-- First update the profiles table to add is_super_admin for the user with this email
UPDATE public.profiles 
SET is_super_admin = false 
WHERE is_super_admin = true;

-- Set the super admin (we'll need to find the user by email through auth.users join)
UPDATE public.profiles p
SET is_super_admin = true
FROM auth.users u
WHERE p.id = u.id AND u.email = 'abelkingsley2k04@gmail.com';

-- Task J & K: Update demo users with sector assignments
-- Update demo teacher to be a primary teacher
UPDATE public.profiles p
SET sector = 'primary', name = 'Demo Primary Teacher'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'demo.teacher@priscilla.edu';

-- Update demo admin to be a primary admin
UPDATE public.profiles p
SET sector = 'primary', name = 'Demo Primary Admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'demo.admin@priscilla.edu';