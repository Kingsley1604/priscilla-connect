-- Create comprehensive report cards table
CREATE TABLE IF NOT EXISTS public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  class_level TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  term TEXT NOT NULL,
  passport_photo_url TEXT,
  
  -- Attendance
  total_school_opened INTEGER DEFAULT 0,
  times_present INTEGER DEFAULT 0,
  times_absent INTEGER DEFAULT 0,
  
  -- Activities
  school_sports TEXT[],
  other_activities TEXT[],
  
  -- Conduct
  conduct_rating TEXT DEFAULT 'Good',
  conduct_percentage INTEGER DEFAULT 95,
  is_exemplary BOOLEAN DEFAULT false,
  
  -- Summary
  total_obtainable_score INTEGER DEFAULT 1700,
  total_score_obtained INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  position TEXT,
  club_organization TEXT,
  class_teacher_comments TEXT,
  head_teacher_comments TEXT,
  class_teacher_name TEXT,
  head_teacher_name TEXT,
  next_term_begins DATE,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report card subjects table for detailed scores
CREATE TABLE IF NOT EXISTS public.report_card_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_card_id UUID NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  half_term_score INTEGER DEFAULT 0 CHECK (half_term_score >= 0 AND half_term_score <= 40),
  exam_score INTEGER DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
  total_score INTEGER DEFAULT 0,
  grade TEXT,
  teacher_remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory items table (connected to store_items)
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_item_id UUID REFERENCES public.store_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  current_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add image upload support to store_items (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'store_items' 
                 AND column_name = 'image_file') THEN
    ALTER TABLE public.store_items ADD COLUMN image_file TEXT;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_cards
CREATE POLICY "Teachers can create and manage report cards"
  ON public.report_cards
  FOR ALL
  USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data->>'role')::text = 'teacher'
    )
  );

CREATE POLICY "Admins can manage all report cards"
  ON public.report_cards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Students can view their own report cards"
  ON public.report_cards
  FOR SELECT
  USING (student_id = auth.uid());

-- RLS Policies for report_card_subjects
CREATE POLICY "Teachers and admins can manage subjects"
  ON public.report_card_subjects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.report_cards rc
      WHERE rc.id = report_card_subjects.report_card_id
      AND (rc.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM auth.users 
        WHERE users.id = auth.uid() 
        AND (users.raw_user_meta_data->>'role')::text = 'admin'
      ))
    )
  );

CREATE POLICY "Students can view their report card subjects"
  ON public.report_card_subjects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.report_cards rc
      WHERE rc.id = report_card_subjects.report_card_id
      AND rc.student_id = auth.uid()
    )
  );

-- RLS Policies for inventory_alerts
CREATE POLICY "Admins can manage all inventory alerts"
  ON public.inventory_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND (users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Trigger for updating report_cards updated_at
CREATE OR REPLACE FUNCTION public.update_report_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_report_cards_updated_at();

-- Function to check inventory and create notifications
CREATE OR REPLACE FUNCTION public.check_inventory_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notifications for low stock items
  INSERT INTO public.admin_notifications (title, message, type)
  SELECT 
    'Low Stock Alert: ' || si.name,
    'Stock level is ' || si.stock || ' (threshold: ' || COALESCE(ia.alert_threshold, 10) || ')',
    'inventory'
  FROM public.store_items si
  LEFT JOIN public.inventory_alerts ia ON ia.store_item_id = si.id
  WHERE si.is_active = true
    AND si.stock <= COALESCE(ia.alert_threshold, 10)
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_notifications an
      WHERE an.title LIKE '%' || si.name || '%'
        AND an.created_at > now() - interval '24 hours'
        AND an.type = 'inventory'
    );
END;
$$;

-- Add trigger to store_items to check inventory on update
CREATE OR REPLACE FUNCTION public.check_store_inventory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock <> OLD.stock THEN
    PERFORM public.check_inventory_levels();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_inventory_on_stock_change
AFTER UPDATE OF stock ON public.store_items
FOR EACH ROW
EXECUTE FUNCTION public.check_store_inventory_trigger();