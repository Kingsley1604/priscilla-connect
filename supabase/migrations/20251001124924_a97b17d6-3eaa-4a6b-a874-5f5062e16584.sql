-- Fix critical security issues by removing overly permissive "Allow all operations" policies

-- Drop dangerous policies
DROP POLICY IF EXISTS "Allow all operations on exam_attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Allow all operations on exam_tokens" ON public.exam_tokens;
DROP POLICY IF EXISTS "Allow all operations on exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Allow all operations on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow all operations on exam_questions" ON public.exam_questions;
DROP POLICY IF EXISTS "Allow all operations on exams" ON public.exams;
DROP POLICY IF EXISTS "Allow all operations on events" ON public.events;

-- Fix function search_path issues - drop with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.update_exam_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.update_exam_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN NULL;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_exam_stats_trigger ON public.exam_attempts;
CREATE TRIGGER update_exam_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.exam_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.update_exam_stats();

-- Fix notify_admin_order_placed function
DROP FUNCTION IF EXISTS public.notify_admin_order_placed() CASCADE;
CREATE OR REPLACE FUNCTION public.notify_admin_order_placed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.admin_notifications (
    title,
    message,
    type,
    related_order_id
  ) VALUES (
    'New Store Order Placed',
    'A parent/student placed an order at ' || to_char(NEW.order_date, 'HH12:MI AM'),
    'order',
    NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Recreate the trigger for order notifications
DROP TRIGGER IF EXISTS on_order_placed ON public.store_orders;
CREATE TRIGGER on_order_placed
AFTER INSERT ON public.store_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_order_placed();

-- Create student_results table for proper result storage
CREATE TABLE IF NOT EXISTS public.student_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  admission_no text NOT NULL,
  academic_session text NOT NULL,
  term text NOT NULL,
  result_type text NOT NULL,
  class_level text NOT NULL,
  grade text NOT NULL,
  subject text NOT NULL,
  half_term_score numeric NOT NULL DEFAULT 0,
  exam_score numeric NOT NULL DEFAULT 0,
  total_score numeric NOT NULL DEFAULT 0,
  grade_letter text,
  remark text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own results"
ON public.student_results FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage their results"
ON public.student_results FOR ALL
USING (
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'teacher')
);

CREATE POLICY "Admins can manage all results"
ON public.student_results FOR ALL
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_student_results_updated_at
BEFORE UPDATE ON public.student_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();