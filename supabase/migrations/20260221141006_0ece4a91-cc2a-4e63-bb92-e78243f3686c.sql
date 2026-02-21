-- Fix existing midterm report cards that have generic term values
-- These were created from the MidtermReportSheet but before the term standardization
UPDATE public.report_cards 
SET term = 'Second Mid-Term'
WHERE term IN ('Second', 'Second Term')
AND id IN (
  SELECT rc.id FROM public.report_cards rc
  INNER JOIN public.result_upload_notifications run 
    ON run.student_name = rc.student_name 
    AND run.result_type = 'Mid Term Result'
);