-- Fix RLS policies for chat_group_members to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can manage group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.chat_group_members;

-- Create security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Create security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id AND is_admin = true
  )
$$;

-- Simple RLS policies using security definer functions
CREATE POLICY "Users can view members of their groups"
ON public.chat_group_members
FOR SELECT
TO authenticated
USING (
  public.is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Authenticated users can insert group members"
ON public.chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Group admins can update members"
ON public.chat_group_members
FOR UPDATE
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
);

CREATE POLICY "Group admins can delete members"
ON public.chat_group_members
FOR DELETE
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_user ON public.chat_group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user ON public.chat_group_members(user_id);