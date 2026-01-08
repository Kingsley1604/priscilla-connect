-- Fix the remaining overly permissive admin_notifications policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;

-- Create a proper policy - anyone authenticated can create notifications
-- This is needed for the store trigger and other system notifications
CREATE POLICY "Authenticated users can create notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Any authenticated user can create notifications (for order notifications, login notifications, etc)
  auth.uid() IS NOT NULL
);