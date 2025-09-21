-- Fix RLS policies to work with mock authentication system
-- Create a more open policy structure for demo purposes

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Users can view approved events" ON events;
DROP POLICY IF EXISTS "Users can manage their own attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Users can view active exams" ON exams;
DROP POLICY IF EXISTS "Users can manage their own exams" ON exams;
DROP POLICY IF EXISTS "Users can view their own results" ON exam_results;
DROP POLICY IF EXISTS "Users can manage exam results" ON exam_results;
DROP POLICY IF EXISTS "Users can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Users can manage announcements" ON announcements;
DROP POLICY IF EXISTS "Users can access tokens" ON exam_tokens;
DROP POLICY IF EXISTS "Users can access exam questions" ON exam_questions;

-- Create simplified open policies for demo
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations on exam_attempts" ON exam_attempts FOR ALL USING (true);
CREATE POLICY "Allow all operations on exams" ON exams FOR ALL USING (true);
CREATE POLICY "Allow all operations on exam_results" ON exam_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on announcements" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all operations on exam_tokens" ON exam_tokens FOR ALL USING (true);
CREATE POLICY "Allow all operations on exam_questions" ON exam_questions FOR ALL USING (true);