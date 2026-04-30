import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Search, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PQ {
  id: string;
  exam_type: string;
  subject: string;
  year: string | null;
  question_text: string;
  options: { label: string; text: string }[];
  correct_answer: string | null;
  explanation: string | null;
}

const PAGE_SIZE = 25;

const PastQuestions = () => {
  const [exam, setExam] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"practice" | "review">("practice");
  const [items, setItems] = useState<PQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const [exams, setExams] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("past_questions" as any)
        .select("exam_type, subject, year")
        .limit(5000);
      const rows = (data as any[]) || [];
      setExams(Array.from(new Set(rows.map(r => r.exam_type))).sort());
      setSubjects(Array.from(new Set(rows.map(r => r.subject))).sort());
      setYears(Array.from(new Set(rows.map(r => r.year).filter(Boolean))).sort().reverse());
    })();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [exam, subject, year, search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("past_questions" as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (exam !== "all") q = q.eq("exam_type", exam);
      if (subject !== "all") q = q.eq("subject", subject);
      if (year !== "all") q = q.eq("year", year);
      if (search.trim()) q = q.ilike("question_text", `%${search.trim()}%`);
      const { data, count } = await q;
      if (cancelled) return;
      setItems((data as any) || []);
      setTotal(count || 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [exam, subject, year, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" /> Past Questions
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={exam} onValueChange={setExam}>
                <SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map(e => <SelectItem key={e} value={e}>{e.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(y => <SelectItem key={y!} value={y!}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search questions or topics…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid grid-cols-2 w-full sm:w-72">
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            No past questions found. Ask an admin to import some.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {items.map((q, idx) => {
              const picked = answers[q.id];
              const isRight = picked && q.correct_answer && picked.toLowerCase() === q.correct_answer.toLowerCase();
              const showFeedback = mode === "practice" && (picked || revealed[q.id]);
              return (
                <Card key={q.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">{q.exam_type.toUpperCase()}</Badge>
                      <Badge variant="secondary">{q.subject}</Badge>
                      {q.year && <Badge>{q.year}</Badge>}
                      <span className="ml-auto text-muted-foreground">
                        Q{page * PAGE_SIZE + idx + 1}
                      </span>
                    </div>
                    <CardTitle className="text-base font-medium leading-relaxed pt-2">
                      {q.question_text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(q.options || []).map(opt => {
                      const isPicked = picked === opt.label;
                      const isCorrect = q.correct_answer?.toLowerCase() === opt.label.toLowerCase();
                      const highlight = showFeedback
                        ? isCorrect ? "border-green-500 bg-green-500/10"
                          : isPicked ? "border-destructive bg-destructive/10" : "border-input"
                        : isPicked ? "border-primary bg-primary/5" : "border-input";
                      return (
                        <button
                          key={opt.label}
                          disabled={mode === "practice" && !!picked}
                          onClick={() => mode === "practice" && setAnswers(a => ({ ...a, [q.id]: opt.label }))}
                          className={`w-full text-left border rounded-md px-3 py-2 text-sm transition-colors ${highlight} ${mode === "review" ? "cursor-default" : "hover:bg-muted/50"}`}
                        >
                          <span className="font-semibold uppercase mr-2">{opt.label}.</span>
                          {opt.text}
                        </button>
                      );
                    })}
                    {showFeedback && (
                      <div className={`flex items-start gap-2 text-sm p-2 rounded-md ${isRight ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
                        {isRight ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
                        <div>
                          <p className="font-medium">
                            {isRight ? "Correct!" : `Correct answer: ${q.correct_answer?.toUpperCase()}`}
                          </p>
                          {q.explanation && <p className="opacity-80 mt-1">{q.explanation}</p>}
                        </div>
                      </div>
                    )}
                    {mode === "practice" && !picked && (
                      <Button variant="ghost" size="sm"
                        onClick={() => setRevealed(r => ({ ...r, [q.id]: true }))}>
                        Reveal answer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} • {total} total
              </span>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages}
                onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PastQuestions;