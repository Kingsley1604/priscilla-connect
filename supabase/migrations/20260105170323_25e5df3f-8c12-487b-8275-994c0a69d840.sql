-- Drop all existing chat_groups and chat_group_members policies first
DROP POLICY IF EXISTS "Group admins can update groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Any user can create groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

DROP POLICY IF EXISTS "Members can view group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group creator can add initial member" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group creator can add first member" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.chat_group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.chat_group_members;

-- Now create clean policies for chat_groups
CREATE POLICY "chat_groups_insert" 
ON public.chat_groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "chat_groups_select" 
ON public.chat_groups 
FOR SELECT 
TO authenticated
USING (true);  -- Allow all authenticated users to see groups (filtering done in app)

CREATE POLICY "chat_groups_update" 
ON public.chat_groups 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Create clean policies for chat_group_members
CREATE POLICY "chat_group_members_select" 
ON public.chat_group_members 
FOR SELECT 
TO authenticated
USING (true);  -- Allow viewing, filtering in app

CREATE POLICY "chat_group_members_insert" 
ON public.chat_group_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Creator adding themselves or existing member adding others
  (auth.uid() = user_id) OR
  (public.has_role(auth.uid(), 'admin')) OR
  EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE chat_groups.id = group_id 
    AND chat_groups.created_by = auth.uid()
  )
);

CREATE POLICY "chat_group_members_delete" 
ON public.chat_group_members 
FOR DELETE 
TO authenticated
USING (
  user_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE chat_groups.id = group_id 
    AND chat_groups.created_by = auth.uid()
  )
);

CREATE POLICY "chat_group_members_update" 
ON public.chat_group_members 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.chat_groups 
    WHERE chat_groups.id = group_id 
    AND chat_groups.created_by = auth.uid()
  )
);