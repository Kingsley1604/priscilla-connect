-- Add status workflow columns to primary/nursery report_cards
-- Mirrors secondary_report_cards lifecycle so admins can approve/reject
-- and teachers can see rejected drafts.

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
CREATE INDEX IF NOT EXISTS idx_report_cards_created_by_status ON public.report_cards(created_by, status);
