-- Add creator_sector column to announcements table for sector-based filtering
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS creator_sector TEXT;

-- Update RLS policies for announcements to allow sector-based filtering
-- Drop existing select policy if exists and recreate
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;

CREATE POLICY "Anyone can view active announcements" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (is_active = true);