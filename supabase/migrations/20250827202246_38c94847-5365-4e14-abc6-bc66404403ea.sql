-- Create exam types enum
CREATE TYPE public.exam_type AS ENUM ('entrance', 'cbt');

-- Create exam status enum  
CREATE TYPE public.exam_status AS ENUM ('draft', 'active', 'completed');

-- Create result status enum
CREATE TYPE public.result_status AS ENUM ('pending', 'approved', 'rejected');

-- Create exams table
CREATE TABLE public.exams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    exam_type public.exam_type NOT NULL DEFAULT 'entrance',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status public.exam_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam questions table
CREATE TABLE public.exam_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) CHECK (correct_answer IN ('a', 'b', 'c', 'd')) NOT NULL,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam tokens table
CREATE TABLE public.exam_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    token_number TEXT NOT NULL UNIQUE,
    student_id UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam attempts table
CREATE TABLE public.exam_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    token_number TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    answers JSONB NOT NULL DEFAULT '{}',
    score INTEGER,
    total_questions INTEGER NOT NULL,
    time_remaining INTEGER, -- in seconds
    UNIQUE(exam_id, student_id)
);

-- Create exam results table
CREATE TABLE public.exam_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    exam_id UUID REFERENCES public.exams(id) NOT NULL,
    score INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    status public.result_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
CREATE POLICY "Teachers can manage their own exams" ON public.exams
FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Students can view active exams" ON public.exams
FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all exams" ON public.exams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- RLS Policies for exam questions
CREATE POLICY "Teachers can manage questions for their exams" ON public.exam_questions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.exams 
        WHERE id = exam_id AND created_by = auth.uid()
    )
);

CREATE POLICY "Students can view questions during active attempts" ON public.exam_questions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.exam_attempts 
        WHERE exam_id = exam_questions.exam_id 
        AND student_id = auth.uid() 
        AND submitted_at IS NULL
    )
);

-- RLS Policies for exam tokens
CREATE POLICY "Admins can manage all tokens" ON public.exam_tokens
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Students can use their own tokens" ON public.exam_tokens
FOR SELECT USING (student_id = auth.uid() OR student_id IS NULL);

-- RLS Policies for exam attempts
CREATE POLICY "Students can manage their own attempts" ON public.exam_attempts
FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their exams" ON public.exam_attempts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.exams 
        WHERE id = exam_id AND created_by = auth.uid()
    )
);

CREATE POLICY "Admins can view all attempts" ON public.exam_attempts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- RLS Policies for exam results
CREATE POLICY "Students can view their own results" ON public.exam_results
FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all results" ON public.exam_results
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exams updated_at
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-submit expired attempts
CREATE OR REPLACE FUNCTION public.auto_submit_expired_attempts()
RETURNS void AS $$
BEGIN
    UPDATE public.exam_attempts 
    SET submitted_at = now()
    WHERE submitted_at IS NULL 
    AND started_at + (
        SELECT INTERVAL '1 minute' * duration_minutes 
        FROM public.exams 
        WHERE id = exam_attempts.exam_id
    ) < now();
END;
$$ LANGUAGE plpgsql;