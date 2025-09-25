-- Add shopping cart functionality and exam statistics
-- Add randomization option to exams
ALTER TABLE public.exams 
ADD COLUMN randomize_questions boolean DEFAULT false;

-- Create exam statistics view for teachers
CREATE OR REPLACE VIEW public.exam_statistics AS
SELECT 
  e.id as exam_id,
  e.title,
  e.created_by,
  COUNT(CASE WHEN ea.submitted_at IS NULL AND ea.started_at IS NOT NULL THEN 1 END) as students_taking,
  COUNT(CASE WHEN ea.submitted_at IS NOT NULL THEN 1 END) as students_completed,
  COUNT(CASE WHEN ea.student_id IS NOT NULL THEN 1 END) - COUNT(CASE WHEN ea.started_at IS NOT NULL THEN 1 END) as students_not_started,
  COUNT(ea.student_id) as total_students
FROM public.exams e
LEFT JOIN public.exam_attempts ea ON e.id = ea.exam_id
WHERE e.status = 'active'
GROUP BY e.id, e.title, e.created_by;

-- Add trigger to update exam stats in real-time
CREATE OR REPLACE FUNCTION public.update_exam_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the view (materialized views can be added later for performance)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on exam_attempts table
DROP TRIGGER IF EXISTS update_exam_stats_trigger ON public.exam_attempts;
CREATE TRIGGER update_exam_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_exam_stats();

-- Add notification system for store orders
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  target_admin_id uuid NULL,
  related_order_id uuid NULL REFERENCES public.store_orders(id)
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin notifications policies
CREATE POLICY "Admins can view all notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data ->> 'role')::text = 'admin'
));

CREATE POLICY "System can create notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update their notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data ->> 'role')::text = 'admin'
));

-- Function to create notification when order is placed
CREATE OR REPLACE FUNCTION public.notify_admin_order_placed()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order notifications
DROP TRIGGER IF EXISTS notify_admin_order_trigger ON public.store_orders;
CREATE TRIGGER notify_admin_order_trigger
  AFTER INSERT ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_order_placed();

-- Add result code validation table
CREATE TABLE IF NOT EXISTS public.result_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  student_id uuid NOT NULL,
  exam_type text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone NULL
);

-- Enable RLS on result_codes
ALTER TABLE public.result_codes ENABLE ROW LEVEL SECURITY;

-- Result codes policies
CREATE POLICY "Students can use their own codes" 
ON public.result_codes 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own codes" 
ON public.result_codes 
FOR UPDATE 
USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all result codes" 
ON public.result_codes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE users.id = auth.uid() 
  AND (users.raw_user_meta_data ->> 'role')::text = 'admin'
));

-- Add updated_at trigger for relevant tables
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();