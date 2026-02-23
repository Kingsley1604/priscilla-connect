
-- Fix the buggy INSERT policy on chat_group_members
-- The "Users can add group members if authorized" policy has a self-referencing join bug
DROP POLICY IF EXISTS "Users can add group members if authorized" ON public.chat_group_members;
DROP POLICY IF EXISTS "chat_group_members_insert" ON public.chat_group_members;
DROP POLICY IF EXISTS "Authenticated users can insert group members" ON public.chat_group_members;

-- Create a single, correct INSERT policy
CREATE POLICY "Authorized users can add group members"
ON public.chat_group_members
FOR INSERT TO authenticated
WITH CHECK (
  -- Users can add themselves to a group
  (auth.uid() = user_id AND (is_admin IS NOT TRUE))
  -- Group creator can add anyone
  OR EXISTS (
    SELECT 1 FROM public.chat_groups
    WHERE chat_groups.id = chat_group_members.group_id
    AND chat_groups.created_by = auth.uid()
  )
  -- Existing group admins can add members
  OR public.is_group_admin(auth.uid(), group_id)
  -- System admins can add anyone
  OR has_role(auth.uid(), 'admin'::app_role)
);
