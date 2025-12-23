-- Fix search_teachers function to query user_roles table instead of raw_user_meta_data
CREATE OR REPLACE FUNCTION public.search_teachers(search_term text)
RETURNS TABLE(id uuid, name text, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    COALESCE(p.name, u.raw_user_meta_data->>'name', u.email) as name,
    u.email
  FROM auth.users u
  INNER JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE ur.role = 'teacher'
  AND (
    u.email ILIKE '%' || search_term || '%'
    OR COALESCE(p.name, u.raw_user_meta_data->>'name', '') ILIKE '%' || search_term || '%'
  )
  LIMIT 20;
$$;

-- Add target_audience column to events table for task F
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT ARRAY['student', 'teacher'];

-- Create classes table for Task I
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_level TEXT NOT NULL,
  section TEXT,
  academic_session TEXT NOT NULL DEFAULT '2024/2025',
  class_teacher_id UUID REFERENCES auth.users(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
CREATE POLICY "Admins can manage all classes" ON public.classes
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view their assigned classes" ON public.classes
FOR SELECT USING (
  class_teacher_id = auth.uid() 
  OR has_role(auth.uid(), 'teacher')
);

-- Create class_students table to track student enrollment
CREATE TABLE IF NOT EXISTS public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  enrolled_by UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(class_id, student_id)
);

-- Enable RLS on class_students
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_students
CREATE POLICY "Admins can manage all class students" ON public.class_students
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage students in their classes" ON public.class_students
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_students.class_id 
    AND c.class_teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own enrollment" ON public.class_students
FOR SELECT USING (student_id = auth.uid());

-- Create suspension_requests table for Task H
CREATE TABLE IF NOT EXISTS public.suspension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on suspension_requests
ALTER TABLE public.suspension_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for suspension_requests
CREATE POLICY "Admins can manage all suspension requests" ON public.suspension_requests
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create and view their suspension requests" ON public.suspension_requests
FOR ALL USING (
  requested_by = auth.uid() 
  OR has_role(auth.uid(), 'teacher')
);

-- Add is_suspended column to profiles for suspension tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create lesson_plan_history table for Task N
CREATE TABLE IF NOT EXISTS public.lesson_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic TEXT NOT NULL,
  duration INTEGER NOT NULL,
  objectives TEXT NOT NULL,
  generated_plan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on lesson_plan_history
ALTER TABLE public.lesson_plan_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_plan_history
CREATE POLICY "Teachers can manage their own lesson plans" ON public.lesson_plan_history
FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all lesson plans" ON public.lesson_plan_history
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Add is_class_teacher to teacher_assignments for Task M
ALTER TABLE public.teacher_assignments ADD COLUMN IF NOT EXISTS is_class_teacher BOOLEAN DEFAULT false;