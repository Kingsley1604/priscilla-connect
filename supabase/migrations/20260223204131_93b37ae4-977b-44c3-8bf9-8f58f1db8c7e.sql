
-- Add missing columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'event';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT '{}';

-- Add missing columns to secondary_report_cards
ALTER TABLE public.secondary_report_cards ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.secondary_report_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add missing columns to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted_by_sender BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted_by_receiver BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- CHAT_GROUP_MEMBERS
CREATE TABLE public.chat_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cgm_select" ON public.chat_group_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cgm_insert" ON public.chat_group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cgm_delete" ON public.chat_group_members FOR DELETE USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.chat_group_members WHERE group_id = chat_group_members.group_id AND user_id = auth.uid() AND is_admin = true
  )
);

-- CHAT_GROUP_MESSAGES
CREATE TABLE public.chat_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  voice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cgmsg_select" ON public.chat_group_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_group_messages.group_id AND user_id = auth.uid())
);
CREATE POLICY "cgmsg_insert" ON public.chat_group_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_group_messages.group_id AND user_id = auth.uid())
);

-- STUDENT_RESULTS (for student dashboard widget)
CREATE TABLE public.student_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  total_score NUMERIC DEFAULT 0,
  grade TEXT,
  exam_id UUID REFERENCES public.exams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select" ON public.student_results FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "sr_insert" ON public.student_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- Add order_date alias column to store_orders
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS order_date TIMESTAMPTZ DEFAULT now();

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_group_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_results TO authenticated;

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_messages;
