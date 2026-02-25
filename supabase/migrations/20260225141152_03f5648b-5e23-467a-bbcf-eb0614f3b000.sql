-- Delete related data first, then the demo exams
DELETE FROM public.exam_results WHERE exam_id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');
DELETE FROM public.exam_attempts WHERE exam_id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');
DELETE FROM public.exam_tokens WHERE exam_id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');
DELETE FROM public.exam_questions WHERE exam_id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');
DELETE FROM public.exam_approval_notifications WHERE exam_id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');
DELETE FROM public.exams WHERE id IN ('1d79f75d-3c99-44ad-9342-96ca9040b3e3', '1357f15d-0297-444e-9493-361eee8ee9b2');