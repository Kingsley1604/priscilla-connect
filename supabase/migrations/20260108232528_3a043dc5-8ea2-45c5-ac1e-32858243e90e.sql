-- Task A: Set abelkingsley2k04@gmail.com as super admin
-- Update the user role from student to admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = 'ad23098c-46db-4f02-95a6-259597f23d15';

-- Set is_super_admin to true in profiles
UPDATE public.profiles 
SET is_super_admin = true, name = 'Super Admin'
WHERE id = 'ad23098c-46db-4f02-95a6-259597f23d15';

-- Task B: Fix RLS security warnings - overly permissive policies

-- Drop the overly permissive chat_group_members_insert policy
DROP POLICY IF EXISTS "Authenticated users can insert group members" ON public.chat_group_members;

-- Create a more restrictive policy for inserting group members
CREATE POLICY "Users can add group members if authorized"
ON public.chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can add themselves
  auth.uid() = user_id
  -- Or admins can add anyone
  OR has_role(auth.uid(), 'admin')
  -- Or group creators can add members
  OR EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE id = group_id AND created_by = auth.uid()
  )
  -- Or existing group members can add new members
  OR EXISTS (
    SELECT 1 FROM public.chat_group_members 
    WHERE group_id = chat_group_members.group_id 
    AND user_id = auth.uid()
  )
);

-- Drop the overly permissive admin_notifications insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.admin_notifications;

-- Create a more restrictive policy for admin notifications
-- Only authenticated users can create notifications (system/triggers still work via SECURITY DEFINER)
CREATE POLICY "Authenticated users can create notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add delete policy for admin notifications
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));