import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Clock, Eye, EyeOff, AlertTriangle, FileText, Calculator, Home, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  exam_type: 'entrance' | 'cbt' | 'termly';
  duration_minutes: number;
}

const ExamInterface = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Anti-cheating measures - comprehensive screenshot and screen capture blocking
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount(prev => {
          const newCount = Math.min(prev + 1, 3);
          if (newCount >= 3) {
            handleAutoSubmit("Maximum warnings reached - auto submitting");
            return 3;
          } else {
            toast.warning(`Warning ${newCount}/3: Tab switching detected!`);
          }
          return newCount;
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block screenshot and screen capture keys
      const blockedKeys = [
        'F12', 'PrintScreen', 'F11',
      ];
      
      const blockedCombos = [
        // Developer tools
        { ctrl: true, shift: true, key: 'I' },
        { ctrl: true, shift: true, key: 'i' },
        { ctrl: true, shift: true, key: 'J' },
        { ctrl: true, shift: true, key: 'j' },
        { ctrl: true, shift: true, key: 'C' },
        { ctrl: true, shift: true, key: 'c' },
        { ctrl: true, key: 'u' },
        { ctrl: true, key: 'U' },
        { ctrl: true, key: 's' },
        { ctrl: true, key: 'S' },
        { ctrl: true, key: 'p' },
        { ctrl: true, key: 'P' },
        // Copy/paste
        { ctrl: true, key: 'c' },
        { ctrl: true, key: 'C' },
        { ctrl: true, key: 'v' },
        { ctrl: true, key: 'V' },
        { meta: true, key: 'c' },
        { meta: true, key: 'C' },
        { meta: true, key: 'v' },
        { meta: true, key: 'V' },
        // Screenshot combos
        { meta: true, shift: true, key: '3' }, // Mac screenshot
        { meta: true, shift: true, key: '4' }, // Mac screenshot area
        { meta: true, shift: true, key: '5' }, // Mac screenshot menu
        { alt: true, key: 'PrintScreen' }, // Windows alt+printscreen
        { key: 'PrintScreen' }, // Windows printscreen
        // Windows snipping tool
        { meta: true, shift: true, key: 's' },
        { meta: true, shift: true, key: 'S' },
      ];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Screenshots and screen capture are not allowed during exam!");
        return false;
      }
      
      for (const combo of blockedCombos) {
        if (
          (combo.ctrl === undefined || e.ctrlKey === combo.ctrl) &&
          (combo.shift === undefined || e.shiftKey === combo.shift) &&
          (combo.meta === undefined || e.metaKey === combo.meta) &&
          (combo.alt === undefined || e.altKey === combo.alt) &&
          e.key === combo.key
        ) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning("This action is not allowed during exam!");
          return false;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during exam!");
      return false;
    };

    const handleResize = () => {
      if (!document.fullscreenElement && examStarted) {
        setWarningCount(prev => {
          const newCount = Math.min(prev + 1, 3);
          if (newCount >= 3) {
            handleAutoSubmit("Maximum warnings reached - auto submitting");
            return 3;
          } else {
            toast.warning(`Warning ${newCount}/3: Return to fullscreen!`);
            enterFullscreen();
          }
          return newCount;
        });
      }
    };

    // Detect screen capture API usage
    const handleScreenCapture = () => {
      toast.error("Screen recording detected! Exam will be submitted.");
      handleAutoSubmit("Screen recording detected");
    };

    // Try to detect screen recording (limited browser support)
    if (navigator.mediaDevices) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      if (originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = async function(...args) {
          handleScreenCapture();
          throw new Error("Screen capture is not allowed during exam");
        };
      }
    }

    // Blur content when window loses focus (prevents some capture methods)
    const handleBlur = () => {
      if (examContainerRef.current) {
        examContainerRef.current.style.filter = 'blur(20px)';
      }
    };

    const handleFocus = () => {
      if (examContainerRef.current) {
        examContainerRef.current.style.filter = 'none';
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("resize", handleResize);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [examStarted]);

  // Disable text selection, prevent screenshots, and block common exploits
  useEffect(() => {
    if (!examStarted) return;

    const style = document.createElement('style');
    style.id = 'exam-anti-cheat-styles';
    style.textContent = `
      .exam-interface {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        pointer-events: auto !important;
      }
      .exam-interface * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .exam-interface input, .exam-interface textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      /* Hide content in print preview to prevent print-screen workarounds */
      @media print {
        .exam-interface {
          display: none !important;
          visibility: hidden !important;
        }
        body::before {
          content: "Printing is not allowed during exam" !important;
          display: block !important;
          text-align: center !important;
          font-size: 24px !important;
          padding: 50px !important;
        }
      }
      /* Watermark overlay to deter photo/screenshot sharing */
      .exam-interface::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 100px,
          rgba(0, 0, 0, 0.01) 100px,
          rgba(0, 0, 0, 0.01) 200px
        );
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);

    // Disable drag events to prevent image saving
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('dragstart', handleDragStart);

    // Disable copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Copying is not allowed during exam!");
      return false;
    };
    document.addEventListener('copy', handleCopy);

    // Disable paste event
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Pasting is not allowed during exam!");
      return false;
    };
    document.addEventListener('paste', handlePaste);

    return () => {
      const existingStyle = document.getElementById('exam-anti-cheat-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [examStarted]);

  const enterFullscreen = async () => {
    if (examContainerRef.current) {
      try {
        await examContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        // Fullscreen may be blocked by browser
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

      // Regular token validation - now uses shared exam_token on exams table
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("id, title, exam_type, duration_minutes, status")
        .eq("exam_token", examToken)
        .eq("status", "active")
        .maybeSingle();

      if (examError || !examData) {
        toast.error("Invalid or expired exam token");
        return;
      }

      // Check if student already attempted this exam
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: existingAttempt } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examData.id)
        .eq("student_id", userData.user?.id)
        .maybeSingle();

      if (existingAttempt) {
        toast.error("You have already taken this exam");
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
          student_id: userData.user?.id,
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

      setExam(examData as any);
      setQuestions(shuffledQuestions as any);
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
        if (import.meta.env.DEV) {
          console.error("Failed to create result record:", resultError);
        }
      }

      setExamCompleted(true);
      
      if (!isAutoSubmit) {
        toast.success("Exam submitted successfully!");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error submitting exam:", error);
      }
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

  // Task K: Calculator functions
  const handleCalcClick = (value: string) => {
    if (value === 'C') {
      setCalcDisplay('0');
    } else if (value === '=') {
      try {
        // Safe evaluation using Function constructor
        const result = Function(`'use strict'; return (${calcDisplay})`)();
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay('Error');
      }
    } else if (value === '⌫') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? value : prev + value);
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
            {/* Task K: Back to dashboard button */}
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              <Home className="h-4 w-4 mr-2" />
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
          <CardContent className="p-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
                {warningCount > 0 && !isMobile && (
                  <Alert className="py-2 px-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Warnings: {warningCount}/3
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Desktop: show controls inline */}
              {!isMobile && (
                <div className="flex items-center gap-3">
                  <Popover open={showCalculator} onOpenChange={setShowCalculator}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculator
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="end">
                      <div className="space-y-2">
                        <div className="bg-muted p-3 rounded text-right text-xl font-mono overflow-hidden">
                          {calcDisplay}
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                            <Button key={btn} variant={btn === '=' ? 'default' : 'outline'} size="sm" onClick={() => handleCalcClick(btn)}>{btn}</Button>
                          ))}
                          <Button variant="destructive" size="sm" className="col-span-2" onClick={() => handleCalcClick('C')}>Clear</Button>
                          <Button variant="outline" size="sm" className="col-span-2" onClick={() => handleCalcClick('⌫')}>⌫</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Home className="h-4 w-4 mr-2" />
                        Back to Dashboard
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Leave Exam?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit your exam and go back to your dashboard? 
                          This action will submit all your current answers and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { submitExam(); navigate("/dashboard"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Submit & Leave
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                  </div>
                </div>
              )}

              {/* Mobile: three-dot menu */}
              {isMobile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Q{currentQuestion + 1}/{questions.length}
                  </span>
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-mono text-lg font-semibold">{formatTime(timeRemaining)}</span>
                        </div>
                        {warningCount > 0 && (
                          <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-amber-700 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Warnings: {warningCount}/3
                          </div>
                        )}
                        <Popover open={showCalculator} onOpenChange={setShowCalculator}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Calculator className="h-4 w-4 mr-2" />
                              Calculator
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <div className="space-y-2">
                              <div className="bg-muted p-3 rounded text-right text-xl font-mono overflow-hidden">{calcDisplay}</div>
                              <div className="grid grid-cols-4 gap-1">
                                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                                  <Button key={btn} variant={btn === '=' ? 'default' : 'outline'} size="sm" onClick={() => handleCalcClick(btn)}>{btn}</Button>
                                ))}
                                <Button variant="destructive" size="sm" className="col-span-2" onClick={() => handleCalcClick('C')}>Clear</Button>
                                <Button variant="outline" size="sm" className="col-span-2" onClick={() => handleCalcClick('⌫')}>⌫</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-destructive">
                              <Home className="h-4 w-4 mr-2" />
                              Back to Dashboard
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave Exam?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will submit all your current answers. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                              <AlertDialogAction onClick={() => { submitExam(); navigate("/dashboard"); }} className="bg-destructive text-destructive-foreground">
                                Submit & Leave
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
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

      {/* Question Navigator - Shows unanswered questions */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Question Navigator</span>
              <span className="text-xs text-muted-foreground">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = index === currentQuestion;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : isAnswered 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                    title={isAnswered ? 'Answered' : 'Not answered'}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            {Object.keys(answers).length < questions.length && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {questions.length - Object.keys(answers).length} question(s) not answered yet
              </p>
            )}
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
                  onClick={() => {
                    const unansweredCount = questions.length - Object.keys(answers).length;
                    if (unansweredCount > 0) {
                      const proceed = window.confirm(
                        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
                      );
                      if (!proceed) return;
                    }
                    submitExam();
                  }}
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