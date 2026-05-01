import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, Lock, Info } from "lucide-react";
import { toast } from "sonner";

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  jamb: [
    "english", "mathematics", "biology", "chemistry", "physics",
    "economics", "government", "literature", "geography", "commerce",
    "accounting", "agriculture", "crk", "irk", "history",
  ],
  waec: [
    "english", "mathematics", "biology", "chemistry", "physics",
    "economics", "government", "literature", "geography", "commerce",
    "accounting", "agriculture", "civic-education", "crk", "irk", "history",
  ],
  neco: [
    "english", "mathematics", "biology", "chemistry", "physics",
    "economics", "government", "literature", "geography", "commerce",
    "accounting", "agriculture", "civic-education", "crk", "irk", "history",
  ],
};

const REQUIRED: Record<string, string[]> = {
  jamb: ["english"],
  waec: ["english", "mathematics"],
  neco: ["english", "mathematics"],
};

const EXAM_META: Record<string, { name: string; rules: string; max?: number }> = {
  jamb: { name: "JAMB", rules: "English is auto-selected. Choose 3 more subjects (4 total max).", max: 4 },
  waec: { name: "WAEC", rules: "English & Mathematics are auto-selected. Add subjects you're registered for." },
  neco: { name: "NECO", rules: "English & Mathematics are auto-selected. Add subjects you're registered for." },
};

const prettify = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ExamPrepConfig = () => {
  const { exam = "" } = useParams();
  const navigate = useNavigate();
  const examKey = exam.toLowerCase();
  const meta = EXAM_META[examKey];
  const allSubjects = SUBJECTS_BY_EXAM[examKey] || [];
  const required = REQUIRED[examKey] || [];

  const [selected, setSelected] = useState<string[]>(required);
  // Question types — JAMB objective only; WAEC/NECO can include theory
  const isJamb = examKey === "jamb";
  const [includeTheory, setIncludeTheory] = useState(false);

  const optional = useMemo(
    () => allSubjects.filter((s) => !required.includes(s)),
    [allSubjects, required],
  );

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p>This exam is not available yet.</p>
            <Button className="mt-4" onClick={() => navigate("/student/exam-prep")}>
              Back to Exam Prep
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggle = (subj: string) => {
    if (required.includes(subj)) return;
    setSelected((prev) => {
      const has = prev.includes(subj);
      if (has) return prev.filter((s) => s !== subj);
      if (meta.max && prev.length >= meta.max) {
        toast.error(`You can pick at most ${meta.max} subjects for ${meta.name}.`);
        return prev;
      }
      return [...prev, subj];
    });
  };

  const start = () => {
    if (isJamb && selected.length !== 4) {
      toast.error("JAMB requires exactly 4 subjects (English + 3).");
      return;
    }
    if (!isJamb && selected.length < required.length + 1) {
      toast.error(`Pick at least one subject in addition to ${required.map(prettify).join(" & ")}.`);
      return;
    }
    const types = isJamb ? ["objective"] : includeTheory ? ["objective", "theory"] : ["objective"];
    const params = new URLSearchParams({
      subjects: selected.join(","),
      types: types.join(","),
    });
    navigate(`/student/exam-prep/${examKey}/session?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link to="/student/exam-prep" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <GraduationCap className="h-5 w-5 text-primary" /> {meta.name} Setup
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-3xl space-y-4">
        <Card className="border-primary/30">
          <CardContent className="p-4 flex gap-3 items-start">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm">{meta.rules}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Choose your subjects</span>
              <Badge variant="secondary">
                {selected.length}{meta.max ? `/${meta.max}` : ""} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Required</p>
              <div className="flex flex-wrap gap-2">
                {required.map((s) => (
                  <Badge key={s} className="bg-primary/15 text-primary border-primary/30 px-3 py-1.5">
                    ✓ {prettify(s)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Optional</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {optional.map((subj) => {
                  const checked = selected.includes(subj);
                  return (
                    <label
                      key={subj}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggle(subj)} />
                      <span className="text-sm">{prettify(subj)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {!isJamb && (
              <label className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer">
                <Checkbox checked={includeTheory} onCheckedChange={(v) => setIncludeTheory(!!v)} />
                <span className="text-sm">Include theory questions (in addition to objective)</span>
              </label>
            )}
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={start}>
          Start Practice
        </Button>
      </main>
    </div>
  );
};

export default ExamPrepConfig;