-- Priscilla Brain research/assignment history per student.
CREATE TABLE IF NOT EXISTS public.priscilla_brain_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_type text NOT NULL CHECK (query_type IN ('assignment','research')),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pbh_student_created ON public.priscilla_brain_history(student_id, created_at DESC);

ALTER TABLE public.priscilla_brain_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage their own brain history" ON public.priscilla_brain_history;
CREATE POLICY "Students manage their own brain history"
  ON public.priscilla_brain_history
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
