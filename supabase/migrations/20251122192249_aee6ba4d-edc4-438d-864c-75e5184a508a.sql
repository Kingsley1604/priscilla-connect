-- Task A: Add department field to profiles table for admins
ALTER TABLE public.profiles 
ADD COLUMN department TEXT;

-- Task B: Add teacher creation fields
ALTER TABLE public.profiles
ADD COLUMN teacher_id TEXT UNIQUE,
ADD COLUMN default_password TEXT,
ADD COLUMN must_change_password BOOLEAN DEFAULT true,
ADD COLUMN phone TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender TEXT,
ADD COLUMN nationality TEXT,
ADD COLUMN home_address TEXT;

-- Task E: Add student profile completion fields
ALTER TABLE public.profiles
ADD COLUMN is_profile_complete BOOLEAN DEFAULT false,
ADD COLUMN admission_no TEXT,
ADD COLUMN current_academic_session TEXT,
ADD COLUMN class_grade TEXT,
ADD COLUMN previous_school TEXT,
ADD COLUMN previous_class TEXT,
ADD COLUMN preferred_language TEXT,
ADD COLUMN parent_guardian_name TEXT,
ADD COLUMN parent_relationship TEXT,
ADD COLUMN parent_phone TEXT,
ADD COLUMN parent_email TEXT,
ADD COLUMN parent_occupation TEXT,
ADD COLUMN parent_address TEXT,
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_relationship TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN emergency_alt_phone TEXT,
ADD COLUMN has_medical_conditions BOOLEAN DEFAULT false,
ADD COLUMN medical_details TEXT,
ADD COLUMN preferred_hospital TEXT,
ADD COLUMN doctor_contact TEXT,
ADD COLUMN consent_info_usage BOOLEAN DEFAULT false,
ADD COLUMN consent_terms BOOLEAN DEFAULT false;

-- Create index for teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON public.profiles(teacher_id);

-- Create function to generate teacher ID
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ID in format TCH + 6 random digits
    new_id := 'TCH' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE teacher_id = new_id) INTO id_exists;
    
    -- If ID doesn't exist, return it
    IF NOT id_exists THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$;

-- Create function to generate default password (8 character alphanumeric)
CREATE OR REPLACE FUNCTION generate_default_password()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, (RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;