-- Create a view for exam questions without correct answers (for students during active exams)
CREATE VIEW public.exam_questions_student AS
SELECT 
    id,
    exam_id,
    question_order,
    created_at,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d
    -- Deliberately excluding correct_answer
FROM public.exam_questions;

-- Enable RLS on the view
ALTER VIEW public.exam_questions_student ENABLE ROW LEVEL SECURITY;

-- Create policy for students to view questions during active attempts (without correct answers)
CREATE POLICY "Students can view questions during active attempts (no answers)" 
ON public.exam_questions_student
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM exam_attempts
        WHERE exam_attempts.exam_id = exam_questions_student.exam_id
        AND exam_attempts.student_id = auth.uid()
        AND exam_attempts.submitted_at IS NULL
    )
);

-- Create a view for exam questions with correct answers (for review after submission)
CREATE VIEW public.exam_questions_review AS
SELECT *
FROM public.exam_questions;

-- Enable RLS on the review view
ALTER VIEW public.exam_questions_review ENABLE ROW LEVEL SECURITY;

-- Create policy for students to view questions with answers after submission
CREATE POLICY "Students can review questions after submission" 
ON public.exam_questions_review
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM exam_attempts
        WHERE exam_attempts.exam_id = exam_questions_review.exam_id
        AND exam_attempts.student_id = auth.uid()
        AND exam_attempts.submitted_at IS NOT NULL
    )
);

-- Teachers and admins can view everything on both views
CREATE POLICY "Teachers can manage questions for their exams (student view)" 
ON public.exam_questions_student
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM exams
        WHERE exams.id = exam_questions_student.exam_id 
        AND exams.created_by = auth.uid()
    )
);

CREATE POLICY "Teachers can manage questions for their exams (review view)" 
ON public.exam_questions_review
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM exams
        WHERE exams.id = exam_questions_review.exam_id 
        AND exams.created_by = auth.uid()
    )
);

-- Admin policies for both views
CREATE POLICY "Admins can view all questions (student view)" 
ON public.exam_questions_student
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE users.id = auth.uid() 
        AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
);

CREATE POLICY "Admins can view all questions (review view)" 
ON public.exam_questions_review
FOR SELECT 
USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE users.id = auth.uid() 
        AND (users.raw_user_meta_data ->> 'role') = 'admin'
    )
);

-- Update the existing student policy on exam_questions to be more restrictive
DROP POLICY "Students can view questions during active attempts" ON public.exam_questions;

-- Now students can only access exam_questions through the secure views