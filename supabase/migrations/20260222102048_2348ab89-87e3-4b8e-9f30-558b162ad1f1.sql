-- Revert Jerry Nnadi's term back to "Second Term" - this is a Termly Examination, NOT Mid-Term
UPDATE public.report_cards 
SET term = 'Second Term'
WHERE id = '4db21620-9bdc-44ec-a93d-9cd2b29f5aa6'
AND term = 'Second Mid-Term';