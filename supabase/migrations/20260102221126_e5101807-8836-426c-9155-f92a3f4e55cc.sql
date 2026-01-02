-- Add super_admin status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_admin boolean DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create chat_group_messages table
CREATE TABLE IF NOT EXISTS public.chat_group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  file_url text,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS for chat_groups
CREATE POLICY "Users can view groups they are members of"
ON public.chat_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_groups.id
    AND chat_group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON public.chat_groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
ON public.chat_groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_groups.id
    AND chat_group_members.user_id = auth.uid()
    AND chat_group_members.is_admin = true
  )
);

CREATE POLICY "Group admins can delete groups"
ON public.chat_groups FOR DELETE
USING (created_by = auth.uid());

-- RLS for chat_group_members
CREATE POLICY "Members can view group members"
ON public.chat_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = chat_group_members.group_id
    AND cgm.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can manage members"
ON public.chat_group_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = chat_group_members.group_id
    AND cgm.user_id = auth.uid()
    AND cgm.is_admin = true
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can join groups"
ON public.chat_group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS for chat_group_messages
CREATE POLICY "Members can view group messages"
ON public.chat_group_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_group_messages.group_id
    AND chat_group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.chat_group_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_group_messages.group_id
    AND chat_group_members.user_id = auth.uid()
  )
);

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_messages;