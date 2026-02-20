-- Grant table-level privileges on exam_questions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exam_questions TO authenticated;

-- Also grant on related tables that may have the same issue
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exam_tokens TO authenticated;