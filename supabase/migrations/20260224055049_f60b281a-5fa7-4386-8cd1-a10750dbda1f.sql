
-- Add exam_token column to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_token TEXT;

-- Update the token generation trigger to set shared token
CREATE OR REPLACE FUNCTION public.generate_exam_tokens_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_prefix TEXT;
  shared_token TEXT;
BEGIN
  IF NEW.status = 'active' AND (OLD.status = 'pending_approval' OR OLD.status = 'unpublished') THEN
    CASE NEW.exam_type::text
      WHEN 'cbt' THEN token_prefix := 'CBT';
      WHEN 'entrance' THEN token_prefix := 'ENT';
      WHEN 'termly' THEN token_prefix := 'TRM';
      ELSE token_prefix := 'EXM';
    END CASE;

    shared_token := token_prefix || TO_CHAR(EXTRACT(YEAR FROM now()), 'FM0000') || LPAD(FLOOR(RANDOM() * 99999 + 1)::TEXT, 5, '0');
    NEW.exam_token := shared_token;
    NEW.approved_at := now();
  END IF;

  IF NEW.status = 'unpublished' AND OLD.status = 'active' THEN
    NEW.exam_token := NULL;
  END IF;

  RETURN NEW;
END;
$$;
