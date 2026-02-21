-- Fix remaining midterm report card with generic term value
UPDATE public.report_cards 
SET term = 'Second Mid-Term'
WHERE id = '4db21620-9bdc-44ec-a93d-9cd2b29f5aa6'
AND term = 'Second Term';