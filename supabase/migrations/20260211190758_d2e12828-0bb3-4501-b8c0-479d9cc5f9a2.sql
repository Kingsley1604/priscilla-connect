-- Delete report card subjects for demo primary teacher's report cards
DELETE FROM report_card_subjects WHERE report_card_id IN (
  SELECT id FROM report_cards WHERE created_by = 'fdba2340-7e5c-439e-918e-cc3b0b007569'
);

-- Delete report cards created by demo primary teacher
DELETE FROM report_cards WHERE created_by = 'fdba2340-7e5c-439e-918e-cc3b0b007569';

-- Delete student results created by demo primary teacher
DELETE FROM student_results WHERE created_by = 'fdba2340-7e5c-439e-918e-cc3b0b007569';