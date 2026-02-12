import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Trash2, Edit, Save, Play, Pause, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { examSchema, questionSchema } from "@/lib/validation";

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  question_order: number;
}

interface Exam {
  id: string;
  title: string;
  exam_type: 'entrance' | 'cbt' | 'termly';
  duration_minutes: number;
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  total_questions?: number;
  randomize_questions: boolean;
  created_by: string;
}

interface ExamStatistics {
  exam_id: string;
  title: string;
  students_taking: number;
  students_completed: number;
  students_not_started: number;
  total_students: number;
}

const ExamBuilder = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [examStats, setExamStats] = useState<ExamStatistics[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  type QuestionTypeOption = 'objective' | 'essay' | 'fill-blank' | 'true-false';
  const [questionType, setQuestionType] = useState<QuestionTypeOption>('objective');

  // Create exam form state
  const [newExam, setNewExam] = useState<{
    title: string;
    exam_type: 'entrance' | 'cbt' | 'termly';
    duration_minutes: number;
    randomize_questions: boolean;
    class_level: string;
    grade: string;
  }>({
    title: "",
    exam_type: "entrance",
    duration_minutes: 60,
    randomize_questions: false,
    class_level: "",
    grade: ""
  });

  // Create question form state
  const [newQuestion, setNewQuestion] = useState<Question>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: 'a' as const,
    question_order: 1
  });

  useEffect(() => {
    loadExams();
    loadExamStatistics();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadQuestions(selectedExam.id);
    }
  }, [selectedExam]);

  const loadExamStatistics = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check if user is super admin - if so, load all stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .rpc('get_exam_statistics', {
          creator_id: profile?.is_super_admin ? null : user.user.id
        });

      if (error) throw error;
      setExamStats(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading exam statistics:", error);
      }
    }
  };

  const loadExams = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.log("No user found for loading exams");
        return;
      }

      console.log("Loading exams for user:", user.user.id);
      setCurrentUserId(user.user.id);

      // Task M & N: Load ALL exams (not just the creator's) so teachers can view others' exams
      // But only the creator can edit/delete
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (examsError) {
        console.error("Error loading exams:", examsError);
        throw examsError;
      }

      console.log("Loaded exams:", examsData?.length || 0);

      // Then get question counts for each exam
      const examsWithCounts = await Promise.all(
        (examsData || []).map(async (exam) => {
          const { count } = await supabase
            .from("exam_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_id", exam.id);
          
          return {
            ...exam,
            total_questions: count || 0
          };
        })
      );

      setExams(examsWithCounts);
    } catch (error) {
      console.error("Error loading exams:", error);
      toast.error("Failed to load exams");
    }
  };

  const loadQuestions = async (examId: string) => {
    try {
      console.log("Loading questions for exam:", examId);
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_order");

      if (error) {
        console.error("Error loading questions:", error);
        throw error;
      }
      
      console.log("Loaded questions:", data?.length || 0);
      setQuestions((data || []).map(q => ({
        ...q,
        correct_answer: q.correct_answer as 'a' | 'b' | 'c' | 'd'
      })));
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    }
  };

  const createExam = async () => {
    // Validate exam data
    try {
      examSchema.parse(newExam);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || "Invalid exam data");
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Task K & L: Use termly directly - it's now a valid enum value
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title: newExam.title,
          exam_type: newExam.exam_type as 'entrance' | 'cbt' | 'termly',
          duration_minutes: newExam.duration_minutes,
          randomize_questions: newExam.randomize_questions,
          created_by: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Notify super admin about exam creation
      try {
        const { data: superAdmin } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_super_admin', true)
          .maybeSingle();
        if (superAdmin) {
          await supabase.from('admin_notifications').insert({
            title: 'Exam Created',
            message: `Teacher created a new ${newExam.exam_type} examination: "${newExam.title}"`,
            type: 'info',
            target_admin_id: superAdmin.id
          });
        }
      } catch (notifyErr) {
        console.error('Error notifying super admin:', notifyErr);
      }

      toast.success("Exam created successfully! Redirecting to exam overview...");
      const examId = data.id;
      const examTitle = newExam.title;
      setIsCreateExamOpen(false);
      setNewExam({
        title: "", 
        exam_type: "entrance", 
        duration_minutes: 60, 
        randomize_questions: false,
        class_level: "",
        grade: ""
      });
      
      // Navigate to exam overview page with examId and title
      navigate(`/teacher/exam-overview?examId=${examId}&title=${encodeURIComponent(examTitle)}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error creating exam:", error);
      }
      toast.error("Failed to create exam");
    } finally {
      setIsLoading(false);
    }
  };

  const createQuestion = async () => {
    if (!selectedExam) return;

    // Validate question data
    try {
      questionSchema.parse(newQuestion);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || "Invalid question data");
      return;
    }

    // Check question limit for entrance exams
    if (selectedExam.exam_type === 'entrance' && questions.length >= 30 && !editingQuestion) {
      toast.error("Entrance exams can have a maximum of 30 questions");
      return;
    }

    setIsLoading(true);
    try {
      const questionOrder = editingQuestion?.question_order || (questions.length + 1);
      
      if (editingQuestion) {
        const { error } = await supabase
          .from("exam_questions")
          .update({
            question_text: newQuestion.question_text,
            option_a: newQuestion.option_a,
            option_b: newQuestion.option_b,
            option_c: newQuestion.option_c,
            option_d: newQuestion.option_d,
            correct_answer: newQuestion.correct_answer
          })
          .eq("id", editingQuestion.id);

        if (error) throw error;
        toast.success("Question updated successfully!");
      } else {
        const { error } = await supabase
          .from("exam_questions")
          .insert({
            exam_id: selectedExam.id,
            question_text: newQuestion.question_text,
            option_a: newQuestion.option_a,
            option_b: newQuestion.option_b,
            option_c: newQuestion.option_c,
            option_d: newQuestion.option_d,
            correct_answer: newQuestion.correct_answer,
            question_order: questionOrder
          });

        if (error) throw error;
        toast.success("Question added successfully!");
      }

      setIsCreateQuestionOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      loadQuestions(selectedExam.id);
      loadExams();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving question:", error);
      }
      toast.error("Failed to save question");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("exam_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      toast.success("Question deleted successfully!");
      if (selectedExam) {
        loadQuestions(selectedExam.id);
        loadExams();
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  // Task C & D: Delete exam with confirmation (only for creator)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

  const deleteExam = async () => {
    if (!examToDelete) return;
    
    try {
      // Delete all questions first
      await supabase.from("exam_questions").delete().eq("exam_id", examToDelete.id);
      // Delete exam tokens
      await supabase.from("exam_tokens").delete().eq("exam_id", examToDelete.id);
      // Delete the exam
      const { error } = await supabase.from("exams").delete().eq("id", examToDelete.id);
      
      if (error) throw error;
      
      toast.success(`"${examToDelete.title}" deleted successfully`);
      if (selectedExam?.id === examToDelete.id) {
        setSelectedExam(null);
        setQuestions([]);
      }
      setExamToDelete(null);
      loadExams();
      loadExamStatistics();
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Failed to delete exam");
    }
  };

  const toggleExamStatus = async (examId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    
    try {
      const { error } = await supabase
        .from("exams")
        .update({ status: newStatus })
        .eq("id", examId);

      if (error) throw error;

      toast.success(`Exam ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      loadExams();
      loadExamStatistics();
    } catch (error) {
      console.error("Error updating exam status:", error);
      toast.error("Failed to update exam status");
    }
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: 'a',
      question_order: questions.length + 1
    });
    setQuestionType('objective');
  };

  const handleCreateQuestionWithType = async () => {
    if (!selectedExam) return;
    if (!newQuestion.question_text.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsLoading(true);
    try {
      const questionOrder = editingQuestion?.question_order || (questions.length + 1);
      let questionData: any = {
        exam_id: selectedExam.id,
        question_order: questionOrder,
      };

      switch (questionType) {
        case 'objective':
          if (!newQuestion.option_a || !newQuestion.option_b) {
            toast.error("Please fill in at least options A and B");
            setIsLoading(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: newQuestion.question_text,
            option_a: newQuestion.option_a,
            option_b: newQuestion.option_b,
            option_c: newQuestion.option_c || "N/A",
            option_d: newQuestion.option_d || "N/A",
            correct_answer: newQuestion.correct_answer
          };
          break;
        case 'true-false':
          questionData = {
            ...questionData,
            question_text: `[TF] ${newQuestion.question_text}`,
            option_a: "True",
            option_b: "False",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: newQuestion.correct_answer
          };
          break;
        case 'essay':
          questionData = {
            ...questionData,
            question_text: `[ESSAY] ${newQuestion.question_text}`,
            option_a: "Manual grading required",
            option_b: "ESSAY",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;
        case 'fill-blank':
          questionData = {
            ...questionData,
            question_text: `[FILL] ${newQuestion.question_text}`,
            option_a: newQuestion.option_a || "Answer required",
            option_b: "FILL_BLANK",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;
      }

      if (editingQuestion?.id) {
        const { error } = await supabase
          .from("exam_questions")
          .update({
            question_text: questionData.question_text,
            option_a: questionData.option_a,
            option_b: questionData.option_b,
            option_c: questionData.option_c,
            option_d: questionData.option_d,
            correct_answer: questionData.correct_answer
          })
          .eq("id", editingQuestion.id);
        if (error) throw error;
        toast.success("Question updated successfully!");
      } else {
        const { error } = await supabase
          .from("exam_questions")
          .insert(questionData);
        if (error) throw error;
        toast.success("Question added successfully!");
      }

      setIsCreateQuestionOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      loadQuestions(selectedExam.id);
      loadExams();
    } catch (error) {
      toast.error("Failed to save question");
    } finally {
      setIsLoading(false);
    }
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      question_order: question.question_order
    });
    setIsCreateQuestionOpen(true);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Edit className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Exam Builder</h1>
                <p className="text-white/80">Create and manage exams</p>
              </div>
            </div>
          </div>
          
          <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-primary hover:bg-white/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    value={newExam.title}
                    onChange={(e) => setNewExam(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter exam title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Exam Type</Label>
                  <Select 
                    value={newExam.exam_type} 
                    onValueChange={(value) => setNewExam(prev => ({ ...prev, exam_type: value as 'entrance' | 'cbt' | 'termly', class_level: "", grade: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrance">Entrance Exam</SelectItem>
                      <SelectItem value="termly">Termly Examination</SelectItem>
                      <SelectItem value="cbt">CBT Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Level Selection */}
                <div>
                  <Label htmlFor="classLevel">Class Level</Label>
                  <Select
                    value={newExam.class_level}
                    onValueChange={(value) => setNewExam(prev => ({ ...prev, class_level: value, grade: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class level" />
                    </SelectTrigger>
                    <SelectContent>
                      {newExam.exam_type === 'entrance' ? (
                        <>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                          <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                        </>
                      ) : newExam.exam_type === 'termly' ? (
                        <>
                          <SelectItem value="Primary">Primary</SelectItem>
                          <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                          <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Primary Upper">Primary Upper (5&6)</SelectItem>
                          <SelectItem value="JSS3">JSS3</SelectItem>
                          <SelectItem value="SS3">SS3</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade Selection */}
                {newExam.class_level && (
                  <div>
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={newExam.grade}
                      onValueChange={(value) => setNewExam(prev => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    <SelectContent>
                      {newExam.exam_type === 'entrance' ? (
                        newExam.class_level === 'Primary' ? (
                          <>
                            <SelectItem value="Play Group 1">Play Group 1</SelectItem>
                            <SelectItem value="Play Group 2">Play Group 2</SelectItem>
                            <SelectItem value="First Grade">First Grade</SelectItem>
                            <SelectItem value="Second Grade">Second Grade</SelectItem>
                            <SelectItem value="Third Grade">Third Grade</SelectItem>
                            <SelectItem value="Fourth Grade">Fourth Grade</SelectItem>
                            <SelectItem value="Fifth Grade">Fifth Grade</SelectItem>
                            <SelectItem value="Sixth Grade">Sixth Grade</SelectItem>
                          </>
                        ) : newExam.class_level === 'Junior Secondary' ? (
                          <>
                            <SelectItem value="Seventh Grade">Seventh Grade</SelectItem>
                            <SelectItem value="Eighth Grade">Eighth Grade</SelectItem>
                            <SelectItem value="Nineth Grade">Nineth Grade</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Tenth Grade">Tenth Grade</SelectItem>
                            <SelectItem value="Eleventh Grade">Eleventh Grade</SelectItem>
                            <SelectItem value="Twelfth Grade">Twelfth Grade</SelectItem>
                          </>
                        )
                      ) : newExam.exam_type === 'termly' ? (
                        newExam.class_level === 'Primary' ? (
                          <>
                            <SelectItem value="Primary 1">Primary 1</SelectItem>
                            <SelectItem value="Primary 2">Primary 2</SelectItem>
                            <SelectItem value="Primary 3">Primary 3</SelectItem>
                            <SelectItem value="Primary 4">Primary 4</SelectItem>
                            <SelectItem value="Primary 5">Primary 5</SelectItem>
                            <SelectItem value="Primary 6">Primary 6</SelectItem>
                          </>
                        ) : newExam.class_level === 'Junior Secondary' ? (
                          <>
                            <SelectItem value="JSS 1">JSS 1</SelectItem>
                            <SelectItem value="JSS 2">JSS 2</SelectItem>
                            <SelectItem value="JSS 3">JSS 3</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="SSS 1">SSS 1</SelectItem>
                            <SelectItem value="SSS 2">SSS 2</SelectItem>
                            <SelectItem value="SSS 3">SSS 3</SelectItem>
                          </>
                        )
                      ) : (
                        newExam.class_level === 'Primary Upper' ? (
                          <>
                            <SelectItem value="Fifth Grade">Fifth Grade</SelectItem>
                            <SelectItem value="Sixth Grade">Sixth Grade</SelectItem>
                          </>
                        ) : newExam.class_level === 'JSS3' ? (
                          <SelectItem value="Nineth Grade">Nineth Grade</SelectItem>
                        ) : (
                          <SelectItem value="Twelfth Grade">Twelfth Grade</SelectItem>
                        )
                      )}
                    </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newExam.duration_minutes}
                    onChange={(e) => setNewExam(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="randomize"
                    checked={newExam.randomize_questions}
                    onCheckedChange={(checked) => setNewExam(prev => ({ ...prev, randomize_questions: !!checked }))}
                  />
                  <Label htmlFor="randomize" className="text-sm">
                    Randomize question order for each student
                  </Label>
                </div>

                <Button onClick={createExam} disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : "Create Exam"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exams List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors group relative hover:bg-accent/50 ${
                        selectedExam?.id === exam.id ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
                      }`}
                      onClick={() => setSelectedExam(exam)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{exam.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                        <Badge variant={exam.exam_type === 'entrance' ? 'default' : 'secondary'}>
                          {exam.exam_type.toUpperCase()}
                        </Badge>
                        <span>•</span>
                        <span>{formatTime(exam.duration_minutes)}</span>
                        {exam.randomize_questions && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              Randomized
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {exam.total_questions} questions
                      </div>
                      
                      {/* Exam Statistics */}
                      {exam.status === 'active' && (() => {
                        const stats = examStats.find(s => s.exam_id === exam.id);
                        return stats ? (
                          <div className="flex items-center gap-4 mt-2 p-2 bg-muted/50 rounded text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-orange-500" />
                              <span>{stats.students_taking} taking</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span>{stats.students_completed} done</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-blue-500" />
                              <span>{stats.students_not_started} not started</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={exam.status === 'active' ? 'default' : 'secondary'}>
                            {exam.status}
                          </Badge>
                      {/* Task C & M: Only show edit/delete for exam creator, delete on hover */}
                      {exam.created_by === currentUserId && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExamStatus(exam.id, exam.status);
                            }}
                          >
                            {exam.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExamToDelete(exam);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {exams.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No exams created yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions Management */}
          <div className="lg:col-span-2">
            {selectedExam ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedExam.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {questions.length} questions • {formatTime(selectedExam.duration_minutes)}
                      </p>
                    </div>
                    
                    <Dialog 
                      open={isCreateQuestionOpen} 
                      onOpenChange={(open) => {
                        setIsCreateQuestionOpen(open);
                        if (!open) {
                          setEditingQuestion(null);
                          resetQuestionForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingQuestion ? 'Edit Question' : 'Add New Question'}
                          </DialogTitle>
                          <DialogDescription>
                            Select a question type and fill in the details.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Question Type Selector */}
                          <div>
                            <Label>Question Type</Label>
                            <Select 
                              value={questionType}
                              onValueChange={(value) => setQuestionType(value as QuestionTypeOption)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="objective">Objective (Multiple Choice)</SelectItem>
                                <SelectItem value="essay">Essay (Free Text)</SelectItem>
                                <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                                <SelectItem value="true-false">True / False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Question Text - common to all types */}
                          <div>
                            <Label htmlFor="question">Question</Label>
                            <Textarea
                              id="question"
                              value={newQuestion.question_text}
                              onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                              placeholder={questionType === 'fill-blank' ? 'Use ___ for blanks (e.g., "The capital of France is ___")' : 'Enter your question'}
                              rows={3}
                            />
                          </div>

                          {/* Objective: show options + correct answer */}
                          {questionType === 'objective' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['a', 'b', 'c', 'd'].map((option) => (
                                  <div key={option}>
                                    <Label htmlFor={`option_${option}`}>Option {option.toUpperCase()}</Label>
                                    <Input
                                      id={`option_${option}`}
                                      value={newQuestion[`option_${option}` as keyof Question] as string}
                                      onChange={(e) => setNewQuestion(prev => ({ 
                                        ...prev, 
                                        [`option_${option}`]: e.target.value 
                                      }))}
                                      placeholder={`Option ${option.toUpperCase()}`}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div>
                                <Label htmlFor="correct">Correct Answer</Label>
                                <Select 
                                  value={newQuestion.correct_answer} 
                                  onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correct_answer: value as 'a' | 'b' | 'c' | 'd' }))}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="a">Option A</SelectItem>
                                    <SelectItem value="b">Option B</SelectItem>
                                    <SelectItem value="c">Option C</SelectItem>
                                    <SelectItem value="d">Option D</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}

                          {/* True/False */}
                          {questionType === 'true-false' && (
                            <div>
                              <Label>Correct Answer</Label>
                              <Select 
                                value={newQuestion.correct_answer === 'a' ? 'true' : 'false'} 
                                onValueChange={(value) => setNewQuestion(prev => ({
                                  ...prev,
                                  option_a: 'True',
                                  option_b: 'False',
                                  option_c: 'N/A',
                                  option_d: 'N/A',
                                  correct_answer: value === 'true' ? 'a' as const : 'b' as const
                                }))}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">True</SelectItem>
                                  <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Essay: just question text + optional word limit note */}
                          {questionType === 'essay' && (
                            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                              Essay questions require manual grading. Students will see a text area to write their response.
                            </div>
                          )}

                          {/* Fill in the blank */}
                          {questionType === 'fill-blank' && (
                            <div>
                              <Label>Correct Answer(s)</Label>
                              <Input
                                value={newQuestion.option_a}
                                onChange={(e) => setNewQuestion(prev => ({ ...prev, option_a: e.target.value }))}
                                placeholder="Enter the correct answer for the blank"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Use ___ in your question to indicate where the blank is.</p>
                            </div>
                          )}

                          <Button onClick={handleCreateQuestionWithType} disabled={isLoading} className="w-full">
                            {isLoading ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {questions.map((question, index) => {
                      // Detect question type from stored prefix
                      const qText = question.question_text;
                      const isEssay = qText.startsWith('[ESSAY]');
                      const isTF = qText.startsWith('[TF]');
                      const isFill = qText.startsWith('[FILL]');
                      const isMulti = qText.startsWith('[MULTI]');
                      const displayText = qText.replace(/^\[(ESSAY|TF|FILL|MULTI|MATCH|NUM|SHORT|FILE)\]\s*/, '');
                      const typeBadge = isEssay ? 'Essay' : isTF ? 'True/False' : isFill ? 'Fill in Blank' : isMulti ? 'Multi-Response' : 'Objective';

                      return (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Question {index + 1}</h4>
                              <Badge variant="outline" className="text-xs">{typeBadge}</Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => editQuestion(question)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteQuestion(question.id!)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm mb-3">{displayText}</p>
                          
                          {/* Render based on question type */}
                          {(isEssay) ? (
                            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">Requires manual grading</div>
                          ) : (isTF) ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {['a', 'b'].map((option) => (
                                <div key={option} className={`p-2 rounded ${question.correct_answer === option ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
                                  <span className="font-medium">{option.toUpperCase()}.</span> {question[`option_${option}` as keyof Question]}
                                </div>
                              ))}
                            </div>
                          ) : (isFill) ? (
                            <div className="text-sm p-2 bg-muted rounded">
                              <span className="font-medium">Answer:</span> {question.option_a}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {['a', 'b', 'c', 'd'].map((option) => (
                                <div key={option} className={`p-2 rounded ${question.correct_answer === option ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
                                  <span className="font-medium">{option.toUpperCase()}.</span> {question[`option_${option}` as keyof Question]}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {questions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No questions added yet. Click "Add Question" to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-muted-foreground">
                    <h3 className="text-lg font-medium mb-2">No Exam Selected</h3>
                    <p>Select an exam from the list to manage its questions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Task D: Delete Exam Confirmation Dialog */}
      <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Examination</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{examToDelete?.title}"? This will permanently remove the exam and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExamBuilder;