-- Delete demo primary teacher report card subjects first
DELETE FROM public.report_card_subjects
WHERE report_card_id IN (
  SELECT id FROM public.report_cards WHERE created_by = 'fdba2340-7e5c-439e-918e-cc3b0b007569'
);

-- Delete demo primary teacher report cards
DELETE FROM public.report_cards
WHERE created_by = 'fdba2340-7e5c-439e-918e-cc3b0b007569';