CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.past_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text,
  exam_type text NOT NULL,
  subject text NOT NULL,
  year text,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text,
  explanation text,
  image_url text,
  section text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_type, subject, year, question_text)
);

CREATE INDEX IF NOT EXISTS idx_past_questions_exam_subject
  ON public.past_questions (exam_type, subject);
CREATE INDEX IF NOT EXISTS idx_past_questions_year
  ON public.past_questions (year);
CREATE INDEX IF NOT EXISTS idx_past_questions_text_trgm
  ON public.past_questions USING gin (question_text gin_trgm_ops);

ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read past questions" ON public.past_questions;
CREATE POLICY "Authenticated can read past questions"
  ON public.past_questions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage past questions" ON public.past_questions;
CREATE POLICY "Admins manage past questions"
  ON public.past_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.past_questions_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid REFERENCES auth.users(id),
  exam_type text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  fetched_count int NOT NULL DEFAULT 0,
  inserted_count int NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.past_questions_import_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read import jobs" ON public.past_questions_import_jobs;
CREATE POLICY "Admins read import jobs"
  ON public.past_questions_import_jobs FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins write import jobs" ON public.past_questions_import_jobs;
CREATE POLICY "Admins write import jobs"
  ON public.past_questions_import_jobs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
