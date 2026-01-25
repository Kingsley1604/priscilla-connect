-- Task A: Fix RLS policy for class_students - Allow teachers to insert via their class
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.class_students;

-- Create a more permissive policy for teachers that checks class_teacher_id
CREATE POLICY "Teachers can manage students in their classes" 
ON public.class_students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id 
    AND c.class_teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_students.class_id 
    AND c.class_teacher_id = auth.uid()
  )
);

-- Task H: Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments', 
  'chat_attachments', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/*', 'audio/*', 'video/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- Storage policy for public read access
CREATE POLICY "Anyone can view chat attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_attachments');

-- Storage policy for authenticated uploads
CREATE POLICY "Authenticated users can upload chat attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat_attachments' AND auth.uid() IS NOT NULL);

-- Storage policy for users to delete their own uploads  
CREATE POLICY "Users can delete their own chat attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'chat_attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Task C/D: Create security_alerts table for super admin notifications
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on security_alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view security alerts
CREATE POLICY "Super admins can view security alerts"
ON public.security_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_super_admin = true
  )
);

-- System can insert security alerts
CREATE POLICY "System can insert security alerts"
ON public.security_alerts FOR INSERT
WITH CHECK (true);

-- Super admins can update security alerts (resolve them)
CREATE POLICY "Super admins can update security alerts"
ON public.security_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_super_admin = true
  )
);