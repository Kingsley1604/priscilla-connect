import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Demo component to set up exam data for testing
export const ExamDemoSetup = () => {
  useEffect(() => {
    setupDemoExams();
  }, []);

  const setupDemoExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if demo exams already exist
      const { data: existingExams } = await supabase
        .from('exams')
        .select('id')
        .in('title', ['Demo CBT Exam', 'Demo Entrance Exam']);

      if (existingExams && existingExams.length > 0) {
        return; // Demo exams already exist
      }

      // Create CBT Exam
      const { data: cbtExam, error: cbtError } = await supabase
        .from('exams')
        .insert({
          title: 'Demo CBT Exam',
          exam_type: 'cbt',
          duration_minutes: 30,
          status: 'active',
          created_by: user.id,
          randomize_questions: true
        })
        .select()
        .single();

      if (cbtError) throw cbtError;

      // Create Entrance Exam
      const { data: entranceExam, error: entranceError } = await supabase
        .from('exams')
        .insert({
          title: 'Demo Entrance Exam',
          exam_type: 'entrance',
          duration_minutes: 60,
          status: 'active',
          created_by: user.id,
          randomize_questions: true
        })
        .select()
        .single();

      if (entranceError) throw entranceError;

      // Add demo questions for CBT exam
      const cbtQuestions = [
        {
          exam_id: cbtExam.id,
          question_text: "What is the capital of Nigeria?",
          option_a: "Lagos",
          option_b: "Abuja",
          option_c: "Kano",
          option_d: "Port Harcourt",
          correct_answer: "b",
          question_order: 1
        },
        {
          exam_id: cbtExam.id,
          question_text: "What is 2 + 2?",
          option_a: "3",
          option_b: "4",
          option_c: "5",
          option_d: "6",
          correct_answer: "b",
          question_order: 2
        },
        {
          exam_id: cbtExam.id,
          question_text: "Which planet is closest to the Sun?",
          option_a: "Venus",
          option_b: "Earth",
          option_c: "Mercury",
          option_d: "Mars",
          correct_answer: "c",
          question_order: 3
        }
      ];

      // Add demo questions for entrance exam
      const entranceQuestions = [
        {
          exam_id: entranceExam.id,
          question_text: "What is the largest ocean on Earth?",
          option_a: "Atlantic",
          option_b: "Indian",
          option_c: "Arctic",
          option_d: "Pacific",
          correct_answer: "d",
          question_order: 1
        },
        {
          exam_id: entranceExam.id,
          question_text: "Who wrote 'Things Fall Apart'?",
          option_a: "Wole Soyinka",
          option_b: "Chinua Achebe",
          option_c: "Chimamanda Adichie",
          option_d: "Ben Okri",
          correct_answer: "b",
          question_order: 2
        },
        {
          exam_id: entranceExam.id,
          question_text: "What is the square root of 144?",
          option_a: "10",
          option_b: "11",
          option_c: "12",
          option_d: "13",
          correct_answer: "c",
          question_order: 3
        },
        {
          exam_id: entranceExam.id,
          question_text: "Which element has the symbol 'O'?",
          option_a: "Gold",
          option_b: "Oxygen",
          option_c: "Osmium",
          option_d: "Oganesson",
          correct_answer: "b",
          question_order: 4
        }
      ];

      await supabase.from('exam_questions').insert([...cbtQuestions, ...entranceQuestions]);

      // Create demo tokens
      const tokens = [
        {
          exam_id: cbtExam.id,
          token_number: 'CBT2025001',
          created_by: user.id
        },
        {
          exam_id: entranceExam.id,
          token_number: 'ENT2025001',
          created_by: user.id
        }
      ];

      await supabase.from('exam_tokens').insert(tokens);

      // Demo exams created successfully
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error setting up demo exams:', error);
      }
    }
  };

  return null;
};
