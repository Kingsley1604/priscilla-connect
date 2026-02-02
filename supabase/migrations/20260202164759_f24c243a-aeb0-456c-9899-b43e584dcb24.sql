-- Task C: Unassign demo students by setting class_grade to NULL
UPDATE public.profiles 
SET class_grade = NULL 
WHERE id IN ('17b534f1-8b1d-4551-893e-2c308d5f5a2c', 'f0b2d836-3e1a-4f18-9493-f3c90ed78adf');

-- Task E & F: Create call_history table for all calls (missed, answered, declined)
CREATE TABLE IF NOT EXISTS public.call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  call_type text NOT NULL DEFAULT 'audio',
  call_status text NOT NULL DEFAULT 'missed', -- 'missed', 'answered', 'declined'
  call_duration integer DEFAULT 0, -- duration in seconds
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on call_history
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for call_history
CREATE POLICY "Users can view their own call history"
ON public.call_history FOR SELECT TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert call history"
ON public.call_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their call history"
ON public.call_history FOR UPDATE TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Task G & H: Create result_upload_notifications table for admin notifications
CREATE TABLE IF NOT EXISTS public.result_upload_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  teacher_name text NOT NULL,
  class_name text NOT NULL,
  student_name text NOT NULL,
  result_type text NOT NULL, -- 'Mid Term Result' or 'Examination Result'
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on result_upload_notifications
ALTER TABLE public.result_upload_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for result_upload_notifications
CREATE POLICY "Admins can view all result notifications"
ON public.result_upload_notifications FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can create result notifications"
ON public.result_upload_notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins can update result notifications"
ON public.result_upload_notifications FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));