import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Calculator, Clock, CheckCircle2, XCircle, WifiOff, Loader2,
  ChevronLeft, ChevronRight, Flag,
} from "lucide-react";
import {
  CachedQuestion, getQuestionsWithOfflineFallback, pruneStaleBundles,
} from "@/lib/pastQuestionsCache";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const JAMB_DURATION_SECONDS = 2 * 60 * 60; // 2 hours

const ExamPrepSession = () => {
  const { exam = "" } = useParams();
  const examKey = exam.toLowerCase();
  const isJamb = examKey === "jamb";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const subjects = (params.get("subjects") || "").split(",").filter(Boolean);
  const types = (params.get("types") || "objective").split(",").filter(Boolean);

  const [questions, setQuestions] = useState<CachedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [theoryNotes, setTheoryNotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Timer (JAMB only)
  const [secondsLeft, setSecondsLeft] = useState(JAMB_DURATION_SECONDS);
  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  useEffect(() => { pruneStaleBundles().catch(() => {}); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { questions: qs, fromCache: fc } = await getQuestionsWithOfflineFallback(
          examKey, subjects, types,
        );
        if (cancelled) return;
        // Shuffle and trim
        const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, 60);
        setQuestions(shuffled);
        setFromCache(fc);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "unknown");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examKey, params.get("subjects"), params.get("types")]);

  // JAMB timer
  useEffect(() => {
    if (!isJamb || submitted || loading) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (!submittedRef.current) {
            submittedRef.current = true;
            handleSubmit(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJamb, submitted, loading]);

  const current = questions[idx];

  const score = useMemo(() => {
    let correct = 0;
    let total = 0;
    for (const q of questions) {
      if (q.question_type !== "objective") continue;
      total++;
      if (q.correct_answer && answers[q.id]?.toLowerCase() === q.correct_answer.toLowerCase()) {
        correct++;
      }
    }
    return { correct, total, pct: total ? Math.round((correct / total) * 1000) / 10 : 0 };
  }, [questions, answers]);

  async function handleSubmit(auto = false) {
    if (submitted) return;
    setSubmitted(true);
    submittedRef.current = true;

    const payload = {
      exam_type: examKey,
      subjects,
      total_questions: questions.length,
      correct_count: score.correct,
      score_percent: score.pct,
      duration_seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      answers: questions.map((q) => ({
        question_id: q.id,
        subject: q.subject,
        type: q.question_type,
        picked: answers[q.id] || null,
        notes: theoryNotes[q.id] || null,
        correct_answer: q.correct_answer,
      })),
      completed_at: new Date().toISOString(),
    };

    try {
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) {
        const { error } = await supabase
          .from("practice_attempts" as any)
          .insert({ ...payload, user_id: u.user.id });
        if (error) throw error;
      }
      toast.success(auto ? "Time up — attempt submitted." : "Attempt saved.");
    } catch (e: any) {
      toast.error("Couldn't save attempt: " + (e?.message || "offline"));
      // Cache locally for later sync
      try {
        const pending = JSON.parse(localStorage.getItem("pq_pending_attempts") || "[]");
        pending.push(payload);
        localStorage.setItem("pq_pending_attempts", JSON.stringify(pending));
      } catch {}
    }
  }

  const fmtTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60)
      .toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-medium">Unable to load questions. Please try again later.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-medium">No questions found for these subjects.</p>
            <p className="text-sm text-muted-foreground">
              Try another subject or exam type.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <Link to="/student/exam-prep" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="outline" className="uppercase">{examKey}</Badge>
            {fromCache && (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" /> Offline
              </Badge>
            )}
            {isJamb && (
              <Badge className={`gap-1 ${secondsLeft < 600 ? "bg-destructive" : ""}`}>
                <Clock className="h-3 w-3" /> {fmtTime(secondsLeft)}
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowCalc(true)} aria-label="Calculator">
            <Calculator className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {idx + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{current.subject}</Badge>
              {current.year && <Badge variant="secondary">{current.year}</Badge>}
              <Badge>{current.question_type}</Badge>
            </div>
            <CardTitle className="text-base sm:text-lg leading-relaxed pt-2">
              {current.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {current.question_type === "objective" ? (
              (current.options || []).map((opt) => {
                const picked = answers[current.id];
                const isPicked = picked === opt.label;
                const isCorrect = current.correct_answer?.toLowerCase() === opt.label.toLowerCase();
                const showFeedback = submitted && current.correct_answer;
                const cls = showFeedback
                  ? isCorrect
                    ? "border-green-500 bg-green-500/10"
                    : isPicked ? "border-destructive bg-destructive/10" : "border-input"
                  : isPicked ? "border-primary bg-primary/5" : "border-input";
                return (
                  <button
                    key={opt.label}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: opt.label }))}
                    className={`w-full text-left border rounded-md px-3 py-2.5 text-sm transition-colors ${cls} ${submitted ? "" : "hover:bg-muted/40"}`}
                  >
                    <span className="font-semibold uppercase mr-2">{opt.label}.</span>
                    {opt.text}
                  </button>
                );
              })
            ) : (
              <Textarea
                placeholder="Type your answer / working here…"
                rows={6}
                value={theoryNotes[current.id] || ""}
                disabled={submitted}
                onChange={(e) => setTheoryNotes((n) => ({ ...n, [current.id]: e.target.value }))}
              />
            )}

            {submitted && current.question_type === "objective" && current.correct_answer && (
              <div className={`flex items-start gap-2 text-sm p-2 rounded-md ${
                answers[current.id]?.toLowerCase() === current.correct_answer.toLowerCase()
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {answers[current.id]?.toLowerCase() === current.correct_answer.toLowerCase()
                  ? <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  : <XCircle className="h-4 w-4 mt-0.5" />}
                <div>
                  <p className="font-medium">
                    Correct answer: {current.correct_answer.toUpperCase()}
                  </p>
                  {current.explanation && <p className="opacity-80 mt-1">{current.explanation}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          {!submitted ? (
            <Button size="sm" onClick={() => setConfirmSubmit(true)}>
              <Flag className="h-4 w-4 mr-1" /> Submit
            </Button>
          ) : (
            <Badge variant="secondary" className="px-3 py-1.5">
              Score: {score.correct}/{score.total} ({score.pct}%)
            </Badge>
          )}
          <Button variant="outline" size="sm"
            onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={idx === questions.length - 1}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {submitted && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Final score</p>
                <p className="text-2xl font-bold">{score.correct}/{score.total} ({score.pct}%)</p>
              </div>
              <Button onClick={() => navigate("/student/exam-prep")}>Back to Exam Prep</Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Calculator dialog */}
      <Dialog open={showCalc} onOpenChange={setShowCalc}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Calculator</DialogTitle></DialogHeader>
          <SimpleCalculator />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your attempt?</AlertDialogTitle>
            <AlertDialogDescription>
              You answered {Object.keys(answers).length} of {questions.length} questions.
              Your score and answers will be saved for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep practicing</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SimpleCalculator = () => {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string>("");
  const press = (k: string) => setExpr((e) => e + k);
  const clear = () => { setExpr(""); setResult(""); };
  const evaluate = () => {
    try {
      // Safe-ish eval: only digits and + - * / . ( )
      if (!/^[\d+\-*/().\s]+$/.test(expr)) {
        setResult("Invalid");
        return;
      }
      // eslint-disable-next-line no-new-func
      const v = Function(`"use strict"; return (${expr})`)();
      setResult(String(v));
    } catch {
      setResult("Error");
    }
  };
  const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"];
  return (
    <div className="space-y-2">
      <div className="bg-muted rounded p-2 text-right text-lg font-mono min-h-[2.5rem] break-all">
        {expr || "0"}
      </div>
      {result !== "" && (
        <div className="text-right text-sm text-muted-foreground font-mono">= {result}</div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <Button key={k} variant={["+","-","*","/","="].includes(k) ? "default" : "outline"}
            onClick={() => k === "=" ? evaluate() : press(k)} className="h-10">
            {k}
          </Button>
        ))}
      </div>
      <Button variant="outline" className="w-full" onClick={clear}>Clear</Button>
    </div>
  );
};

export default ExamPrepSession;