-- Task A FIX: Add RLS policy to allow all authenticated users to view basic profile info for chat
-- This is needed so students and teachers can see each other in chat

-- First, allow all authenticated users to view profiles (for chat user list)
CREATE POLICY "All users can view profiles for chat" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Allow all authenticated users to view user_roles (to get roles for chat)
CREATE POLICY "All users can view roles for chat" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);

-- Task B FIX: Update super admin to have NO sector (super admin manages both schools)
UPDATE public.profiles 
SET sector = NULL 
WHERE is_super_admin = true;