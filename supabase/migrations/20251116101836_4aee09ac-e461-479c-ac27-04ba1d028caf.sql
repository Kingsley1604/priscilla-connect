-- Create homework table
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  class_level TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create homework submissions table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  marks_obtained INTEGER,
  teacher_feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  graded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late'))
);

-- Create teacher assignments table for assigning teachers to classes/subjects
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  teacher_name TEXT NOT NULL,
  class_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  academic_session TEXT NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(teacher_id, class_level, subject, academic_session)
);

-- Enable RLS
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework
CREATE POLICY "Teachers can manage their homework"
ON public.homework
FOR ALL
USING (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'teacher'
  )
);

CREATE POLICY "Students can view homework for their class"
ON public.homework
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all homework"
ON public.homework
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- RLS Policies for homework submissions
CREATE POLICY "Students can create their own submissions"
ON public.homework_submissions
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their own submissions"
ON public.homework_submissions
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their homework"
ON public.homework_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id
    AND h.created_by = auth.uid()
  )
);

CREATE POLICY "Teachers can update submissions for their homework"
ON public.homework_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id
    AND h.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can manage all submissions"
ON public.homework_submissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- RLS Policies for teacher assignments
CREATE POLICY "Teachers can view their own assignments"
ON public.teacher_assignments
FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage all teacher assignments"
ON public.teacher_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_homework_updated_at
BEFORE UPDATE ON public.homework
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();