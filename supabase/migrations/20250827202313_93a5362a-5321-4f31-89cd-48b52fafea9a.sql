-- Fix security warnings by setting search_path for functions

-- Update the update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update the auto_submit_expired_attempts function with proper search_path
CREATE OR REPLACE FUNCTION public.auto_submit_expired_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;