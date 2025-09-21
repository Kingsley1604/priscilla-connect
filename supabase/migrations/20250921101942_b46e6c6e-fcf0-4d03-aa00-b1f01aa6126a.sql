-- Fix RLS policies to work with mock authentication system
-- Remove references to auth.users table and use user_id directly

-- Drop existing policies that reference auth.users
DROP POLICY IF EXISTS "Admins can view all attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Admins can view all exams" ON exams;
DROP POLICY IF EXISTS "Admins can manage all results" ON exam_results;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Students can create and view their own events" ON events;
DROP POLICY IF EXISTS "Students can view approved events" ON events;
DROP POLICY IF EXISTS "Teachers can create and view their own events" ON events;
DROP POLICY IF EXISTS "Teachers can view approved admin events" ON events;
DROP POLICY IF EXISTS "Admins can manage all announcements" ON announcements;
DROP POLICY IF EXISTS "Students and teachers can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage all tokens" ON exam_tokens;

-- Create new simplified policies that work with mock auth
-- Events table policies
CREATE POLICY "Users can view their own events" 
ON events FOR ALL 
USING (created_by = auth.uid()::text);

CREATE POLICY "Users can view approved events" 
ON events FOR SELECT 
USING (status = 'approved');

-- Exam attempts policies
CREATE POLICY "Users can manage their own attempts" 
ON exam_attempts FOR ALL 
USING (student_id = auth.uid()::text);

-- Exams policies
CREATE POLICY "Users can view active exams" 
ON exams FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can manage their own exams" 
ON exams FOR ALL 
USING (created_by = auth.uid()::text);

-- Exam results policies
CREATE POLICY "Users can view their own results" 
ON exam_results FOR SELECT 
USING (student_id = auth.uid()::text);

CREATE POLICY "Users can manage exam results" 
ON exam_results FOR ALL 
USING (true); -- Temporary open policy for demo

-- Announcements policies
CREATE POLICY "Users can view active announcements" 
ON announcements FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage announcements" 
ON announcements FOR ALL 
USING (true); -- Temporary open policy for demo

-- Exam tokens policies
CREATE POLICY "Users can access tokens" 
ON exam_tokens FOR ALL 
USING (true); -- Temporary open policy for demo

-- Exam questions policies
CREATE POLICY "Users can access exam questions" 
ON exam_questions FOR ALL 
USING (true); -- Temporary open policy for demo