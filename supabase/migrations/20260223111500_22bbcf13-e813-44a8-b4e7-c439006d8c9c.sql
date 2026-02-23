
-- Add new enum values for exam approval workflow
ALTER TYPE public.exam_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE public.exam_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.exam_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add marks and approval columns to exams table
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS marks_per_question numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_marks numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT NULL;

-- Create exam approval notifications table
CREATE TABLE IF NOT EXISTS public.exam_approval_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  teacher_name text NOT NULL,
  exam_title text NOT NULL,
  exam_type text NOT NULL,
  action text NOT NULL DEFAULT 'submitted', -- submitted, approved, rejected
  admin_id uuid DEFAULT NULL,
  admin_comment text DEFAULT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_approval_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all exam approval notifications
CREATE POLICY "Admins can view exam approval notifications"
ON public.exam_approval_notifications
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update exam approval notifications (mark as read)
CREATE POLICY "Admins can update exam approval notifications"
ON public.exam_approval_notifications
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can view their own notifications (for approval/rejection feedback)
CREATE POLICY "Teachers can view their exam notifications"
ON public.exam_approval_notifications
FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- Teachers can update their own notifications (mark as read)
CREATE POLICY "Teachers can update their exam notifications"
ON public.exam_approval_notifications
FOR UPDATE TO authenticated
USING (teacher_id = auth.uid());

-- Authenticated users can create notifications
CREATE POLICY "Authenticated users can create exam approval notifications"
ON public.exam_approval_notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to auto-generate exam tokens on approval
CREATE OR REPLACE FUNCTION public.generate_exam_tokens_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_prefix TEXT;
  token_count INT := 50; -- Generate 50 tokens per exam
  i INT;
  new_token TEXT;
BEGIN
  -- Only trigger when status changes to 'active' (approved)
  IF NEW.status = 'active' AND OLD.status = 'pending_approval' THEN
    -- Set token prefix based on exam type
    CASE NEW.exam_type::text
      WHEN 'cbt' THEN token_prefix := 'CBT';
      WHEN 'entrance' THEN token_prefix := 'ENT';
      WHEN 'termly' THEN token_prefix := 'TRM';
      ELSE token_prefix := 'EXM';
    END CASE;

    -- Generate tokens
    FOR i IN 1..token_count LOOP
      new_token := token_prefix || TO_CHAR(EXTRACT(YEAR FROM now()), 'FM0000') || LPAD(i::TEXT, 3, '0');
      
      INSERT INTO public.exam_tokens (exam_id, token_number, created_by)
      VALUES (NEW.id, new_token, COALESCE(NEW.approved_by, NEW.created_by))
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Set approved_at timestamp
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto token generation
DROP TRIGGER IF EXISTS exam_approval_token_trigger ON public.exams;
CREATE TRIGGER exam_approval_token_trigger
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_exam_tokens_on_approval();
