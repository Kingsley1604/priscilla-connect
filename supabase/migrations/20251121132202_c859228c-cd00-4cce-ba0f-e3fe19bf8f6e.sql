-- Fix RLS policy vulnerability on store_orders table
-- Replace insecure raw_user_meta_data check with secure has_role() function

DROP POLICY IF EXISTS "Admins can view all orders" ON public.store_orders;

CREATE POLICY "Admins can view all orders"
ON public.store_orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add comprehensive input validation for student_results table
CREATE OR REPLACE FUNCTION validate_student_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate scores are within valid range
  IF NEW.half_term_score < 0 OR NEW.half_term_score > 100 THEN
    RAISE EXCEPTION 'Half term score must be between 0 and 100';
  END IF;
  
  IF NEW.exam_score < 0 OR NEW.exam_score > 100 THEN
    RAISE EXCEPTION 'Exam score must be between 0 and 100';
  END IF;
  
  IF NEW.total_score < 0 OR NEW.total_score > 100 THEN
    RAISE EXCEPTION 'Total score must be between 0 and 100';
  END IF;
  
  -- Validate text fields are not empty
  IF LENGTH(TRIM(NEW.student_name)) < 2 THEN
    RAISE EXCEPTION 'Student name must be at least 2 characters';
  END IF;
  
  IF LENGTH(TRIM(NEW.subject)) < 2 THEN
    RAISE EXCEPTION 'Subject must be at least 2 characters';
  END IF;
  
  IF LENGTH(TRIM(NEW.class_level)) < 1 THEN
    RAISE EXCEPTION 'Class level is required';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_student_result_trigger
BEFORE INSERT OR UPDATE ON public.student_results
FOR EACH ROW
EXECUTE FUNCTION validate_student_result();

-- Add validation for store_items to prevent negative prices/stock
CREATE OR REPLACE FUNCTION validate_store_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;
  
  IF NEW.stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;
  
  IF LENGTH(TRIM(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Item name must be at least 2 characters';
  END IF;
  
  IF LENGTH(TRIM(NEW.category)) < 2 THEN
    RAISE EXCEPTION 'Category must be at least 2 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_store_item_trigger
BEFORE INSERT OR UPDATE ON public.store_items
FOR EACH ROW
EXECUTE FUNCTION validate_store_item();

-- Add validation for homework_submissions
CREATE OR REPLACE FUNCTION validate_homework_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marks_obtained IS NOT NULL THEN
    -- Get total marks from homework table
    DECLARE
      total_marks INT;
    BEGIN
      SELECT h.total_marks INTO total_marks
      FROM public.homework h
      WHERE h.id = NEW.homework_id;
      
      IF NEW.marks_obtained < 0 OR NEW.marks_obtained > total_marks THEN
        RAISE EXCEPTION 'Marks obtained must be between 0 and %', total_marks;
      END IF;
    END;
  END IF;
  
  IF LENGTH(TRIM(NEW.student_name)) < 2 THEN
    RAISE EXCEPTION 'Student name must be at least 2 characters';
  END IF;
  
  IF NEW.submission_text IS NOT NULL AND LENGTH(NEW.submission_text) > 50000 THEN
    RAISE EXCEPTION 'Submission text too large (max 50000 characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_homework_submission_trigger
BEFORE INSERT OR UPDATE ON public.homework_submissions
FOR EACH ROW
EXECUTE FUNCTION validate_homework_submission();

-- Add validation for exam_results
CREATE OR REPLACE FUNCTION validate_exam_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score < 0 THEN
    RAISE EXCEPTION 'Score cannot be negative';
  END IF;
  
  IF NEW.percentage < 0 OR NEW.percentage > 100 THEN
    RAISE EXCEPTION 'Percentage must be between 0 and 100';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_exam_result_trigger
BEFORE INSERT OR UPDATE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION validate_exam_result();

-- Add validation for report_cards
CREATE OR REPLACE FUNCTION validate_report_card()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.average_score IS NOT NULL AND (NEW.average_score < 0 OR NEW.average_score > 100) THEN
    RAISE EXCEPTION 'Average score must be between 0 and 100';
  END IF;
  
  IF NEW.percentage IS NOT NULL AND (NEW.percentage < 0 OR NEW.percentage > 100) THEN
    RAISE EXCEPTION 'Percentage must be between 0 and 100';
  END IF;
  
  IF NEW.conduct_percentage IS NOT NULL AND (NEW.conduct_percentage < 0 OR NEW.conduct_percentage > 100) THEN
    RAISE EXCEPTION 'Conduct percentage must be between 0 and 100';
  END IF;
  
  IF NEW.times_absent IS NOT NULL AND NEW.times_absent < 0 THEN
    RAISE EXCEPTION 'Times absent cannot be negative';
  END IF;
  
  IF NEW.times_present IS NOT NULL AND NEW.times_present < 0 THEN
    RAISE EXCEPTION 'Times present cannot be negative';
  END IF;
  
  IF LENGTH(TRIM(NEW.student_name)) < 2 THEN
    RAISE EXCEPTION 'Student name must be at least 2 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_report_card_trigger
BEFORE INSERT OR UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION validate_report_card();