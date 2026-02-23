
-- =============================================
-- STEP 1: CREATE ALL TABLES (no cross-referencing RLS)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  sector TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  class_grade TEXT,
  is_suspended BOOLEAN DEFAULT false,
  admission_no TEXT,
  must_change_password BOOLEAN DEFAULT false,
  gender TEXT,
  date_of_birth TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  target_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  related_order_id UUID,
  target_admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_level TEXT NOT NULL,
  section TEXT,
  academic_session TEXT DEFAULT '2024/2025',
  class_teacher_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(class_id, student_id)
);

CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL,
  subject TEXT,
  is_class_teacher BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.suspension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'cbt' CHECK (exam_type IN ('entrance', 'cbt', 'termly')),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'pending_approval', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  total_questions INTEGER DEFAULT 0,
  randomize_questions BOOLEAN DEFAULT false,
  marks_per_question INTEGER,
  total_marks INTEGER,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  submitted_for_approval_at TIMESTAMPTZ,
  class_level TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  question_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exam_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  token_number TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  student_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id),
  token_number TEXT,
  answers JSONB DEFAULT '{}',
  time_remaining INTEGER,
  total_questions INTEGER,
  score INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.exam_attempts(id),
  exam_id UUID REFERENCES public.exams(id),
  student_id UUID REFERENCES auth.users(id),
  score INTEGER DEFAULT 0,
  total_questions INTEGER,
  percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exam_approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT DEFAULT 'general',
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  rating NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  phone_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_item_id UUID REFERENCES public.store_items(id) ON DELETE CASCADE,
  alert_threshold INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  admission_no TEXT,
  gender TEXT,
  date_of_birth TEXT,
  class_level TEXT NOT NULL,
  academic_session TEXT,
  term TEXT,
  total_school_opened INTEGER,
  times_present INTEGER,
  times_absent INTEGER,
  conduct_percentage NUMERIC,
  conduct_rating TEXT,
  total_obtainable_score NUMERIC,
  total_score_obtained NUMERIC,
  average_score NUMERIC,
  percentage NUMERIC,
  position TEXT,
  club_organization TEXT,
  class_teacher_comments TEXT,
  head_teacher_comments TEXT,
  class_teacher_name TEXT,
  head_teacher_name TEXT,
  next_term_begins TEXT,
  passport_photo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.report_card_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  half_term_score NUMERIC,
  exam_score NUMERIC,
  total_score NUMERIC,
  grade TEXT,
  teacher_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.secondary_report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT NOT NULL,
  admission_no TEXT,
  class_level TEXT NOT NULL,
  arm TEXT,
  gender TEXT,
  age INTEGER,
  academic_session TEXT,
  term TEXT,
  next_term_begins TEXT,
  position_in_class INTEGER,
  total_students INTEGER,
  student_total_score NUMERIC,
  student_average NUMERIC,
  class_average NUMERIC,
  highest_average NUMERIC,
  lowest_average NUMERIC,
  days_school_opened INTEGER,
  days_present INTEGER,
  days_absent INTEGER,
  class_teacher_remark TEXT,
  principal_remark TEXT,
  status TEXT DEFAULT 'draft',
  rejection_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.secondary_report_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  ca1_score NUMERIC DEFAULT 0,
  ca2_score NUMERIC DEFAULT 0,
  exam_score NUMERIC DEFAULT 0,
  grade TEXT,
  teacher_remark TEXT,
  class_average NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.secondary_affective_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  punctuality INTEGER DEFAULT 3,
  neatness INTEGER DEFAULT 3,
  attendance INTEGER DEFAULT 3,
  honesty INTEGER DEFAULT 3,
  reliability INTEGER DEFAULT 3,
  relationship_with_staff INTEGER DEFAULT 3,
  relationship_with_students INTEGER DEFAULT 3,
  self_control INTEGER DEFAULT 3,
  attitude_to_school INTEGER DEFAULT 3
);

CREATE TABLE public.secondary_psychomotor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  handwriting INTEGER DEFAULT 3,
  reading INTEGER DEFAULT 3,
  verbal_fluency INTEGER DEFAULT 3,
  musical_skills INTEGER DEFAULT 3,
  creative_arts INTEGER DEFAULT 3,
  physical_education INTEGER DEFAULT 3,
  general_reasoning INTEGER DEFAULT 3
);

CREATE TABLE public.result_upload_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'result_upload',
  is_read BOOLEAN DEFAULT false,
  teacher_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  sector TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  call_type TEXT DEFAULT 'audio',
  duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'missed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.missed_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default setting
INSERT INTO public.system_settings (setting_key, setting_value) VALUES ('maintenance_mode', 'false');

-- =============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspension_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_approval_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_report_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_affective_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_psychomotor_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_upload_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missed_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: RLS POLICIES (all tables exist now)
-- =============================================

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin_teacher" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- user_roles
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "roles_select_admin" ON public.user_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "roles_insert_own" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "roles_insert_admin" ON public.user_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- system_settings
CREATE POLICY "settings_select" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update" ON public.system_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "settings_admin_insert" ON public.system_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- announcements
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "announcements_admin" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- admin_notifications
CREATE POLICY "notif_select" ON public.admin_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "notif_insert" ON public.admin_notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notif_update" ON public.admin_notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "notif_delete" ON public.admin_notifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- classes
CREATE POLICY "classes_select" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "classes_manage" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- class_students
CREATE POLICY "cs_select" ON public.class_students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cs_manage" ON public.class_students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- teacher_assignments
CREATE POLICY "ta_select" ON public.teacher_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ta_manage" ON public.teacher_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- suspension_requests
CREATE POLICY "sr_select" ON public.suspension_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "sr_insert" ON public.suspension_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "sr_update" ON public.suspension_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- exams
CREATE POLICY "exams_select" ON public.exams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "exams_insert" ON public.exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "exams_update" ON public.exams FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "exams_delete" ON public.exams FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- exam_questions
CREATE POLICY "eq_select" ON public.exam_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "eq_manage" ON public.exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- exam_tokens
CREATE POLICY "et_select" ON public.exam_tokens FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "et_manage" ON public.exam_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "et_student_update" ON public.exam_tokens FOR UPDATE USING (auth.uid() IS NOT NULL);

-- exam_attempts
CREATE POLICY "ea_select" ON public.exam_attempts FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "ea_insert" ON public.exam_attempts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ea_update" ON public.exam_attempts FOR UPDATE USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- exam_results
CREATE POLICY "er_select" ON public.exam_results FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "er_insert" ON public.exam_results FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "er_update" ON public.exam_results FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- exam_approval_notifications
CREATE POLICY "ean_select" ON public.exam_approval_notifications FOR SELECT USING (
  teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ean_insert" ON public.exam_approval_notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ean_update" ON public.exam_approval_notifications FOR UPDATE USING (
  teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- store_items
CREATE POLICY "si_select" ON public.store_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "si_manage" ON public.store_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- store_orders
CREATE POLICY "so_select" ON public.store_orders FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "so_insert" ON public.store_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "so_update" ON public.store_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- inventory_alerts
CREATE POLICY "ia_manage" ON public.inventory_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- report_cards
CREATE POLICY "rc_select" ON public.report_cards FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "rc_insert" ON public.report_cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "rc_update" ON public.report_cards FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- report_card_subjects
CREATE POLICY "rcs_select" ON public.report_card_subjects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'student'))
);
CREATE POLICY "rcs_insert" ON public.report_card_subjects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- secondary_report_cards
CREATE POLICY "src_select" ON public.secondary_report_cards FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "src_insert" ON public.secondary_report_cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "src_update" ON public.secondary_report_cards FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- secondary_report_subjects
CREATE POLICY "srs_select" ON public.secondary_report_subjects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'student'))
);
CREATE POLICY "srs_insert" ON public.secondary_report_subjects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- secondary_affective_traits
CREATE POLICY "sat_all" ON public.secondary_affective_traits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "sat_select_student" ON public.secondary_affective_traits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND rc.student_id = auth.uid())
);

-- secondary_psychomotor_skills
CREATE POLICY "sps_all" ON public.secondary_psychomotor_skills FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "sps_select_student" ON public.secondary_psychomotor_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND rc.student_id = auth.uid())
);

-- result_upload_notifications
CREATE POLICY "run_select" ON public.result_upload_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "run_insert" ON public.result_upload_notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "run_update" ON public.result_upload_notifications FOR UPDATE USING (
  teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- events
CREATE POLICY "events_select" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_manage" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- call_history
CREATE POLICY "ch_select" ON public.call_history FOR SELECT USING (caller_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "ch_insert" ON public.call_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- missed_calls
CREATE POLICY "mc_select" ON public.missed_calls FOR SELECT USING (caller_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "mc_insert" ON public.missed_calls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- chat_groups
CREATE POLICY "cg_select" ON public.chat_groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cg_insert" ON public.chat_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cg_update" ON public.chat_groups FOR UPDATE USING (created_by = auth.uid());

-- =============================================
-- STEP 4: FUNCTIONS AND TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_exam_question_count(p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count
  FROM public.exam_questions eq
  WHERE eq.exam_id = p_exam_id;
  RETURN question_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_exam_questions_for_attempt(p_exam_attempt_id UUID)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  question_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT eq.id, eq.question_text, eq.option_a, eq.option_b, eq.option_c, eq.option_d, eq.question_order
  FROM public.exam_questions eq
  JOIN public.exam_attempts ea ON ea.exam_id = eq.exam_id
  WHERE ea.id = p_exam_attempt_id
  ORDER BY eq.question_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_question_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_attempt(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth_chat_attachments" ON storage.objects
  FOR ALL USING (bucket_id = 'chat_attachments' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'chat_attachments' AND auth.uid() IS NOT NULL);
