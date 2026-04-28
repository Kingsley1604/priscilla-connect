-- Finalize report_cards workflow columns + RLS for admin updates.
-- Idempotent — safe to re-run.

ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.report_cards DROP CONSTRAINT IF EXISTS report_cards_status_check;
ALTER TABLE public.report_cards
  ADD CONSTRAINT report_cards_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'published', 'draft', 'submitted'));

CREATE INDEX IF NOT EXISTS idx_report_cards_status ON public.report_cards(status);
CREATE INDEX IF NOT EXISTS idx_report_cards_created_by_status ON public.report_cards(created_by, status);

-- Mirror columns on secondary_report_cards for symmetry (idempotent)
ALTER TABLE public.secondary_report_cards
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_secondary_report_cards_status ON public.secondary_report_cards(status);

-- Ensure admins can update report_cards (status changes for approve/reject).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='report_cards' AND policyname='Admins can update report cards') THEN
    DROP POLICY "Admins can update report cards" ON public.report_cards;
  END IF;
END $$;

CREATE POLICY "Admins can update report cards"
  ON public.report_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='secondary_report_cards' AND policyname='Admins can update secondary report cards') THEN
    DROP POLICY "Admins can update secondary report cards" ON public.secondary_report_cards;
  END IF;
END $$;

CREATE POLICY "Admins can update secondary report cards"
  ON public.secondary_report_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
  );
