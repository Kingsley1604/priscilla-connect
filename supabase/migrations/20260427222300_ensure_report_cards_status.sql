-- Idempotent re-run to ensure status workflow columns exist on report_cards.
-- The original migration (20260426120000) did not apply in this environment — the
-- admin Result Management page currently errors with "column report_cards.status
-- does not exist". This migration is safe to run multiple times.

ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.report_cards
  DROP CONSTRAINT IF EXISTS report_cards_status_check;
ALTER TABLE public.report_cards
  ADD CONSTRAINT report_cards_status_check
  CHECK (status IN ('pending','approved','rejected','published','draft'));

CREATE INDEX IF NOT EXISTS idx_report_cards_status ON public.report_cards(status);
CREATE INDEX IF NOT EXISTS idx_report_cards_created_by_status
  ON public.report_cards(created_by, status);
