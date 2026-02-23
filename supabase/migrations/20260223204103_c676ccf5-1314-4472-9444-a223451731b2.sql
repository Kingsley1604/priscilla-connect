
-- Add missing column to announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS creator_sector TEXT;

-- Add missing columns to missed_calls
ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'audio';
ALTER TABLE public.missed_calls ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT false;

-- Add missing column to exam_results
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add missing columns to result_upload_notifications
ALTER TABLE public.result_upload_notifications ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE public.result_upload_notifications ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.result_upload_notifications ADD COLUMN IF NOT EXISTS result_type TEXT;
ALTER TABLE public.result_upload_notifications ADD COLUMN IF NOT EXISTS student_name TEXT;

-- CHAT_MESSAGES
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  group_id UUID REFERENCES public.chat_groups(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cm_select" ON public.chat_messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "cm_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "cm_update" ON public.chat_messages FOR UPDATE USING (
  receiver_id = auth.uid() OR sender_id = auth.uid()
);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- HOMEWORK
CREATE TABLE public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  class_level TEXT,
  due_date TIMESTAMPTZ,
  total_marks INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hw_select" ON public.homework FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "hw_manage" ON public.homework FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- HOMEWORK_SUBMISSIONS
CREATE TABLE public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  student_name TEXT,
  submission_text TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'submitted',
  grade NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hs_select" ON public.homework_submissions FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "hs_insert" ON public.homework_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "hs_update" ON public.homework_submissions FOR UPDATE USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- ADMIN_SUSPENSION_NOTIFICATIONS
CREATE TABLE public.admin_suspension_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.suspension_requests(id),
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  class_name TEXT,
  reason TEXT,
  is_read BOOLEAN DEFAULT false,
  is_handled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_suspension_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asn_select" ON public.admin_suspension_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "asn_insert" ON public.admin_suspension_notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "asn_update" ON public.admin_suspension_notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RESULT_CODES
CREATE TABLE public.result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  student_id UUID REFERENCES auth.users(id),
  exam_type TEXT,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.result_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rcode_select" ON public.result_codes FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "rcode_insert" ON public.result_codes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "rcode_update" ON public.result_codes FOR UPDATE USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_suspension_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_codes TO authenticated;
