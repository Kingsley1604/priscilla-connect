-- Fix report_card_subjects RLS policy to use has_role() instead of raw_user_meta_data
DROP POLICY IF EXISTS "Teachers and admins can manage subjects" ON public.report_card_subjects;

CREATE POLICY "Teachers and admins can manage subjects" ON public.report_card_subjects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    WHERE rc.id = report_card_subjects.report_card_id
    AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.report_cards rc
    WHERE rc.id = report_card_subjects.report_card_id
    AND (rc.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);