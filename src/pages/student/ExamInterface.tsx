import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Eye, EyeOff, AlertTriangle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_order: number;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, string>;
  time_remaining: number;
  started_at: string;
}

interface Exam {
  id: string;
  title: string;
  exam_type: 'entrance' | 'cbt';
  duration_minutes: number;
}

const ExamInterface = () => {
  const navigate = useNavigate();
  const [examToken, setExamToken] = useState("");
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Anti-cheating measures
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleAutoSubmit("Too many tab switches detected");
          } else {
            toast.warning(`Warning ${newCount}/3: Tab switching detected!`);
          }
          return newCount;
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s") ||
        (e.metaKey && e.key === "c") ||
        (e.ctrlKey && e.key === "c") ||
        (e.metaKey && e.key === "v") ||
        (e.ctrlKey && e.key === "v")
      ) {
        e.preventDefault();
        toast.warning("Action not allowed during exam!");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleResize = () => {
      if (!document.fullscreenElement && examStarted) {
        setWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            handleAutoSubmit("Exited fullscreen mode");
          } else {
            toast.warning(`Warning ${newCount}/2: Return to fullscreen!`);
            enterFullscreen();
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
    };
  }, [examStarted]);

  // Disable text selection and prevent common exploits
  useEffect(() => {
    if (!examStarted) return;

    const style = document.createElement('style');
    style.textContent = `
      .exam-interface * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      .exam-interface input, .exam-interface textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [examStarted]);

  const enterFullscreen = async () => {
    if (examContainerRef.current) {
      try {
        await examContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("Error entering fullscreen:", error);
      }
    }
  };

  const startExam = async () => {
    if (!examToken.trim()) {
      toast.error("Please enter your exam token");
      return;
    }

    setIsLoading(true);
    try {
      // Check for demo tokens first (client-side fallback)
      if (examToken === "CBT2025001" || examToken === "ENT2025001") {
        const isDemoCBT = examToken === "CBT2025001";
        const demoExam: Exam = {
          id: isDemoCBT ? "demo-cbt-exam" : "demo-entrance-exam",
          title: isDemoCBT ? "Demo CBT Exam" : "Demo Entrance Exam",
          exam_type: isDemoCBT ? "cbt" : "entrance",
          duration_minutes: isDemoCBT ? 30 : 60
        };

        const demoQuestions: Question[] = isDemoCBT 
          ? [
              {
                id: "demo-q1",
                question_text: "What is the capital of Nigeria?",
                option_a: "Lagos",
                option_b: "Abuja",
                option_c: "Kano",
                option_d: "Port Harcourt",
                question_order: 1
              },
              {
                id: "demo-q2",
                question_text: "What is 2 + 2?",
                option_a: "3",
                option_b: "4",
                option_c: "5",
                option_d: "6",
                question_order: 2
              },
              {
                id: "demo-q3",
                question_text: "Which planet is closest to the Sun?",
                option_a: "Venus",
                option_b: "Earth",
                option_c: "Mercury",
                option_d: "Mars",
                question_order: 3
              }
            ]
          : [
              {
                id: "demo-q1",
                question_text: "What is the largest ocean on Earth?",
                option_a: "Atlantic",
                option_b: "Indian",
                option_c: "Arctic",
                option_d: "Pacific",
                question_order: 1
              },
              {
                id: "demo-q2",
                question_text: "Who wrote 'Things Fall Apart'?",
                option_a: "Wole Soyinka",
                option_b: "Chinua Achebe",
                option_c: "Chimamanda Adichie",
                option_d: "Ben Okri",
                question_order: 2
              },
              {
                id: "demo-q3",
                question_text: "What is the square root of 144?",
                option_a: "10",
                option_b: "11",
                option_c: "12",
                option_d: "13",
                question_order: 3
              },
              {
                id: "demo-q4",
                question_text: "Which element has the symbol 'O'?",
                option_a: "Gold",
                option_b: "Oxygen",
                option_c: "Osmium",
                option_d: "Oganesson",
                question_order: 4
              },
              {
                id: "demo-q5",
                question_text: "What is the longest river in Africa?",
                option_a: "Congo",
                option_b: "Niger",
                option_c: "Nile",
                option_d: "Zambezi",
                question_order: 5
              }
            ];

        setExam(demoExam);
        setQuestions(demoQuestions);
        setCurrentAttempt({
          id: "demo-attempt",
          exam_id: demoExam.id,
          student_id: "demo-student",
          answers: {},
          time_remaining: demoExam.duration_minutes * 60,
          started_at: new Date().toISOString()
        });
        setTimeRemaining(demoExam.duration_minutes * 60);
        setExamStarted(true);
        
        await enterFullscreen();
        startTimer();
        
        toast.success("Demo exam started! Good luck!");
        setIsLoading(false);
        return;
      }

      // Regular token validation for real exams
      const { data: tokenData, error: tokenError } = await supabase
        .from("exam_tokens")
        .select(`
          *,
          exams (
            id,
            title,
            exam_type,
            duration_minutes,
            status
          )
        `)
        .eq("token_number", examToken)
        .eq("used_at", null)
        .single();

      if (tokenError || !tokenData) {
        toast.error("Invalid or already used exam token");
        return;
      }

      const examData = tokenData.exams;
      if (examData.status !== "active") {
        toast.error("Exam is not currently active");
        return;
      }

      // Check if student already attempted this exam
      const { data: existingAttempt } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examData.id)
        .eq("student_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (existingAttempt) {
        toast.error("You have already taken this exam");
        return;
      }

      // Mark token as used and create attempt
      const { data: user } = await supabase.auth.getUser();
      
      const { error: updateTokenError } = await supabase
        .from("exam_tokens")
        .update({ 
          used_at: new Date().toISOString(),
          student_id: user.user?.id 
        })
        .eq("id", tokenData.id);

      if (updateTokenError) {
        toast.error("Failed to start exam");
        return;
      }

      // Get question count securely
      const { data: questionCount, error: countError } = await supabase
        .rpc('get_exam_question_count', {
          exam_id: examData.id
        });

      if (countError || questionCount === null) {
        toast.error("Failed to load exam questions");
        return;
      }

      // Create exam attempt first
      const { data: attemptData, error: attemptError } = await supabase
        .from("exam_attempts")
        .insert({
          exam_id: examData.id,
          student_id: user.user?.id,
          token_number: examToken,
          total_questions: questionCount,
          time_remaining: examData.duration_minutes * 60
        })
        .select()
        .single();

      if (attemptError || !attemptData) {
        toast.error("Failed to create exam attempt");
        return;
      }

      // Now fetch questions securely (without correct answers)
      const { data: questionsData, error: questionsError } = await supabase
        .rpc('get_exam_questions_for_attempt', {
          exam_attempt_id: attemptData.id
        });

      if (questionsError || !questionsData) {
        toast.error("Failed to load exam questions");
        return;
      }

      // Shuffle questions for this student
      const shuffledQuestions = [...questionsData].sort(() => Math.random() - 0.5);

      setExam(examData);
      setQuestions(shuffledQuestions);
      setCurrentAttempt({
        ...attemptData,
        answers: attemptData.answers as Record<string, string>
      });
      setTimeRemaining(examData.duration_minutes * 60);
      setExamStarted(true);
      
      await enterFullscreen();
      startTimer();
      
      toast.success("Exam started! Good luck!");
    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error("Failed to start exam");
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit("Time up");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoSubmit = async (reason: string) => {
    console.log(`Auto-submitting exam: ${reason}`);
    await submitExam(true);
  };

  const submitExam = async (isAutoSubmit = false) => {
    if (!currentAttempt || !exam) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        // Note: We can't access correct answers from frontend for security
        // Score calculation will be done by admin/backend
      });

      // Update attempt with submission
      const { error: updateError } = await supabase
        .from("exam_attempts")
        .update({
          submitted_at: new Date().toISOString(),
          answers: answers,
          time_remaining: timeRemaining
        })
        .eq("id", currentAttempt.id);

      if (updateError) {
        toast.error("Failed to submit exam");
        return;
      }

      // Create result record (pending approval)
      const { error: resultError } = await supabase
        .from("exam_results")
        .insert({
          attempt_id: currentAttempt.id,
          student_id: currentAttempt.student_id,
          exam_id: exam.id,
          score: 0, // Will be calculated by admin
          percentage: 0 // Will be calculated by admin
        });

      if (resultError) {
        console.error("Failed to create result record:", resultError);
      }

      setExamCompleted(true);
      
      if (!isAutoSubmit) {
        toast.success("Exam submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
    }
  };

  const selectAnswer = (answer: string) => {
    const questionId = questions[currentQuestion]?.id;
    if (questionId) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionMessage = () => {
    if (exam?.exam_type === 'entrance') {
      return "Thanks for your time! Your Entrance Exam result will be released within 24 hours. Stay confident and remember that your journey is just beginning!";
    } else {
      return "Thank you for taking the time to complete your CBT test. Your result will be available within the next 24 hours. We appreciate your dedication and wish you continued success!";
    }
  };

  if (examCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Exam Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-accent/50 rounded-lg">
              <p className="text-lg leading-relaxed">{getCompletionMessage()}</p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-center mt-4">Enter Exam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">Exam Token Number</Label>
              <Input
                id="token"
                value={examToken}
                onChange={(e) => setExamToken(e.target.value)}
                placeholder="Enter your exam token"
              />
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Anti-cheating measures will be active during the exam. Avoid tab switching, 
                copying/pasting, or exiting fullscreen mode.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={startExam} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Starting Exam..." : "Start Exam"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const selectedAnswer = answers[currentQ?.id] || "";

  return (
    <div 
      ref={examContainerRef}
      className="exam-interface min-h-screen bg-background p-4 select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Timer and Progress Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
                {warningCount > 0 && (
                  <Alert className="py-2 px-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Warnings: {warningCount}/3
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Question Card */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestion + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-base leading-relaxed">
              {currentQ.question_text}
            </div>
            
            <div className="space-y-3">
              {['a', 'b', 'c', 'd'].map((option) => (
                <div
                  key={option}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedAnswer === option 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted-foreground/20'
                  }`}
                  onClick={() => selectAnswer(option)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedAnswer === option 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground/40'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm text-muted-foreground mr-2">
                        {option.toUpperCase()}.
                      </span>
                      {currentQ[`option_${option}` as keyof Question]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={() => submitExam()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Submit Exam
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamInterface;