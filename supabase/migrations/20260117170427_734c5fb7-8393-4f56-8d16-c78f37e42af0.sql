-- Create secondary_report_cards table for Knightdale Middle College results
CREATE TABLE public.secondary_report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  class_level TEXT NOT NULL, -- JSS1, JSS2, JSS3, SS1, SS2, SS3
  arm TEXT, -- A, B, C (optional)
  gender TEXT,
  age INTEGER,
  
  -- Academic Information
  academic_session TEXT NOT NULL,
  term TEXT NOT NULL, -- First Term, Second Term, Third Term
  next_term_begins DATE,
  
  -- Class Performance Summary
  position_in_class INTEGER,
  total_students INTEGER,
  student_total_score DECIMAL(10, 2),
  student_average DECIMAL(5, 2),
  class_average DECIMAL(5, 2),
  highest_average DECIMAL(5, 2),
  lowest_average DECIMAL(5, 2),
  
  -- Attendance
  days_school_opened INTEGER DEFAULT 0,
  days_present INTEGER DEFAULT 0,
  days_absent INTEGER GENERATED ALWAYS AS (days_school_opened - days_present) STORED,
  
  -- Remarks
  class_teacher_remark TEXT,
  principal_remark TEXT,
  
  -- Status & Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'published')),
  
  -- Created by teacher, approved by admin
  created_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(student_id, academic_session, term)
);

-- Create secondary_report_subjects table for academic results
CREATE TABLE public.secondary_report_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  
  subject_name TEXT NOT NULL,
  ca1_score DECIMAL(4, 2) DEFAULT 0 CHECK (ca1_score >= 0 AND ca1_score <= 20),
  ca2_score DECIMAL(4, 2) DEFAULT 0 CHECK (ca2_score >= 0 AND ca2_score <= 20),
  exam_score DECIMAL(4, 2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
  total_score DECIMAL(5, 2) GENERATED ALWAYS AS (ca1_score + ca2_score + exam_score) STORED,
  class_average DECIMAL(5, 2),
  grade TEXT,
  teacher_remark TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create secondary_affective_traits table (1-5 rating)
CREATE TABLE public.secondary_affective_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  neatness INTEGER CHECK (neatness >= 1 AND neatness <= 5),
  attendance INTEGER CHECK (attendance >= 1 AND attendance <= 5),
  honesty INTEGER CHECK (honesty >= 1 AND honesty <= 5),
  reliability INTEGER CHECK (reliability >= 1 AND reliability <= 5),
  relationship_with_staff INTEGER CHECK (relationship_with_staff >= 1 AND relationship_with_staff <= 5),
  relationship_with_students INTEGER CHECK (relationship_with_students >= 1 AND relationship_with_students <= 5),
  self_control INTEGER CHECK (self_control >= 1 AND self_control <= 5),
  attitude_to_school INTEGER CHECK (attitude_to_school >= 1 AND attitude_to_school <= 5),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_card_id)
);

-- Create secondary_psychomotor_skills table (1-5 rating)
CREATE TABLE public.secondary_psychomotor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES public.secondary_report_cards(id) ON DELETE CASCADE,
  
  handwriting INTEGER CHECK (handwriting >= 1 AND handwriting <= 5),
  reading INTEGER CHECK (reading >= 1 AND reading <= 5),
  verbal_fluency INTEGER CHECK (verbal_fluency >= 1 AND verbal_fluency <= 5),
  musical_skills INTEGER CHECK (musical_skills >= 1 AND musical_skills <= 5),
  creative_arts INTEGER CHECK (creative_arts >= 1 AND creative_arts <= 5),
  physical_education INTEGER CHECK (physical_education >= 1 AND physical_education <= 5),
  general_reasoning INTEGER CHECK (general_reasoning >= 1 AND general_reasoning <= 5),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_card_id)
);

-- Enable RLS
ALTER TABLE public.secondary_report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_report_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_affective_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_psychomotor_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secondary_report_cards
-- Teachers can view/edit their own drafts and submitted results
CREATE POLICY "Teachers can view their own results"
  ON public.secondary_report_cards FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    (student_id = auth.uid() AND status = 'published')
  );

CREATE POLICY "Teachers can create results"
  ON public.secondary_report_cards FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Teachers can update their draft results"
  ON public.secondary_report_cards FOR UPDATE
  TO authenticated
  USING (
    (created_by = auth.uid() AND status IN ('draft', 'rejected')) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Similar policies for related tables
CREATE POLICY "Users can view report subjects"
  ON public.secondary_report_subjects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.secondary_report_cards rc
      WHERE rc.id = report_card_id AND (
        rc.created_by = auth.uid() OR
        public.has_role(auth.uid(), 'admin'::public.app_role) OR
        (rc.student_id = auth.uid() AND rc.status = 'published')
      )
    )
  );

CREATE POLICY "Teachers can insert report subjects"
  ON public.secondary_report_subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.secondary_report_cards rc
      WHERE rc.id = report_card_id AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

CREATE POLICY "Teachers can update report subjects"
  ON public.secondary_report_subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.secondary_report_cards rc
      WHERE rc.id = report_card_id AND (
        (rc.created_by = auth.uid() AND rc.status IN ('draft', 'rejected')) OR
        public.has_role(auth.uid(), 'admin'::public.app_role)
      )
    )
  );

-- Policies for affective traits
CREATE POLICY "Users can view affective traits"
  ON public.secondary_affective_traits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (rc.student_id = auth.uid() AND rc.status = 'published'))));

CREATE POLICY "Teachers can insert affective traits"
  ON public.secondary_affective_traits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))));

CREATE POLICY "Teachers can update affective traits"
  ON public.secondary_affective_traits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND ((rc.created_by = auth.uid() AND rc.status IN ('draft', 'rejected')) OR public.has_role(auth.uid(), 'admin'::public.app_role))));

-- Policies for psychomotor skills
CREATE POLICY "Users can view psychomotor skills"
  ON public.secondary_psychomotor_skills FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (rc.student_id = auth.uid() AND rc.status = 'published'))));

CREATE POLICY "Teachers can insert psychomotor skills"
  ON public.secondary_psychomotor_skills FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))));

CREATE POLICY "Teachers can update psychomotor skills"
  ON public.secondary_psychomotor_skills FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.secondary_report_cards rc WHERE rc.id = report_card_id AND ((rc.created_by = auth.uid() AND rc.status IN ('draft', 'rejected')) OR public.has_role(auth.uid(), 'admin'::public.app_role))));

-- Trigger for updated_at
CREATE TRIGGER update_secondary_report_cards_updated_at
  BEFORE UPDATE ON public.secondary_report_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();