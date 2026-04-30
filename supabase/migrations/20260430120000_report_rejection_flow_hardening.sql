-- Task A hardening: ensure report rejection works end-to-end.
-- 1) Make sure workflow columns exist on both report_cards tables (idempotent).
-- 2) Ensure RLS UPDATE policies exist for admins / super admins.
-- 3) Ensure teachers can read admin_notifications targeted to them.

ALTER TABLE public.report_cards
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.secondary_report_cards
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.report_cards DROP CONSTRAINT IF EXISTS report_cards_status_check;
ALTER TABLE public.report_cards
  ADD CONSTRAINT report_cards_status_check
  CHECK (status IN ('pending','approved','rejected','published','draft','submitted'));

-- Drop and re-create the admin update policies so we know they're current.
DROP POLICY IF EXISTS "Admins can update report cards" ON public.report_cards;
CREATE POLICY "Admins can update report cards"
  ON public.report_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update secondary report cards" ON public.secondary_report_cards;
CREATE POLICY "Admins can update secondary report cards"
  ON public.secondary_report_cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.is_super_admin = true))
    OR EXISTS (SELECT 1 FROM public.user_roles ur
               WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Make sure teachers can SELECT notifications targeted to them.
DROP POLICY IF EXISTS "notif_select" ON public.admin_notifications;
CREATE POLICY "notif_select" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (
    target_admin_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','teacher'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('admin','teacher') OR is_super_admin = true))
  );

-- Add a unique index for report cards to prevent duplicate concurrent inserts of
-- the same student/term/session (Task B concurrency safety).
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_cards_student_term_session
  ON public.report_cards (student_id, term, academic_session)
  WHERE student_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_secondary_report_cards_student_term_session
  ON public.secondary_report_cards (student_id, term, academic_session)
  WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_cards_created_by ON public.report_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_secondary_report_cards_created_by ON public.secondary_report_cards(created_by);
