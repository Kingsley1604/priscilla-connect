
-- Task C: Delete demo exam data
DELETE FROM public.exam_questions WHERE exam_id IN (
  SELECT id FROM public.exams WHERE title IN ('Demo CBT Exam', 'Demo Entrance Exam')
);
DELETE FROM public.exam_tokens WHERE exam_id IN (
  SELECT id FROM public.exams WHERE title IN ('Demo CBT Exam', 'Demo Entrance Exam')
);
DELETE FROM public.exam_attempts WHERE exam_id IN (
  SELECT id FROM public.exams WHERE title IN ('Demo CBT Exam', 'Demo Entrance Exam')
);
DELETE FROM public.exam_results WHERE exam_id IN (
  SELECT id FROM public.exams WHERE title IN ('Demo CBT Exam', 'Demo Entrance Exam')
);
DELETE FROM public.exams WHERE title IN ('Demo CBT Exam', 'Demo Entrance Exam');
