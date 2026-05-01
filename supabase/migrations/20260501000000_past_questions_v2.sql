-- Add question_type for objective/theory/practical, plus attempt tracking + cron
ALTER TABLE public.past_questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'objective';

CREATE INDEX IF NOT EXISTS idx_past_questions_qtype
  ON public.past_questions (exam_type, subject, question_type);

-- Student practice attempts
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  total_questions int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  score_percent numeric(5,2) NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own attempts" ON public.practice_attempts;
CREATE POLICY "Users manage own attempts"
  ON public.practice_attempts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all attempts" ON public.practice_attempts;
CREATE POLICY "Admins read all attempts"
  ON public.practice_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user
  ON public.practice_attempts (user_id, created_at DESC);

-- Schedule background bulk import nightly via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'auto-import-past-questions-nightly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'auto-import-past-questions-nightly',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fctarpegeatdizeuzzyb.supabase.co/functions/v1/auto-import-past-questions',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
