-- Task D & E: Access ID auth system + class-scoped visibility

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_access_id ON public.profiles(access_id) WHERE access_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_access_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  new_id TEXT;
  exists_already BOOLEAN;
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  LOOP
    new_id := 'PCN-';
    FOR i IN 1..6 LOOP
      new_id := new_id || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE access_id = new_id) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_id;
END;
$$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.id FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'student' AND p.access_id IS NULL
  LOOP
    UPDATE public.profiles SET access_id = public.generate_access_id() WHERE id = r.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.assign_access_id_for_student()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'student' THEN
    UPDATE public.profiles
    SET access_id = COALESCE(access_id, public.generate_access_id())
    WHERE id = NEW.user_id AND access_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_access_id ON public.user_roles;
CREATE TRIGGER trg_assign_access_id
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.assign_access_id_for_student();

CREATE OR REPLACE FUNCTION public.is_class_teacher_of(_user_id UUID, _class_level TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_assignments ta
    WHERE ta.teacher_id = _user_id
      AND ta.is_class_teacher = true
      AND ta.is_active = true
      AND lower(trim(ta.class_level)) = lower(trim(_class_level))
  );
$$;

DROP POLICY IF EXISTS "Class teachers view their class students" ON public.profiles;
CREATE POLICY "Class teachers view their class students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.id AND ur.role = 'student')
  AND profiles.class_grade IS NOT NULL
  AND public.is_class_teacher_of(auth.uid(), profiles.class_grade)
);

CREATE OR REPLACE FUNCTION public.lookup_email_by_access_id(_access_id TEXT)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result_email TEXT;
BEGIN
  IF _access_id IS NULL OR length(trim(_access_id)) = 0 THEN RETURN NULL; END IF;
  SELECT u.email INTO result_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE upper(trim(p.access_id)) = upper(trim(_access_id))
    AND ur.role = 'student'
    AND COALESCE(p.is_suspended, false) = false
  LIMIT 1;
  RETURN result_email;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_email_by_access_id(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_access_id(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.preview_access_id(_access_id TEXT)
RETURNS TABLE(name TEXT, class_grade TEXT, sector TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.name, p.class_grade, p.sector
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE upper(trim(p.access_id)) = upper(trim(_access_id))
    AND ur.role = 'student'
    AND COALESCE(p.is_suspended, false) = false
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.preview_access_id(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_access_id(TEXT) TO anon, authenticated;
