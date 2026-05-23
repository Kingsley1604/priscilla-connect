import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, BookOpen, Globe, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "sonner";
import { isExamPrepEligible as checkEligible } from "@/lib/examPrepEligibility";

type Exam = {
  code: string;
  name: string;
  description: string;
  color: string;
  comingSoon?: boolean;
};

const EXAMS: Exam[] = [
  { code: "waec", name: "WAEC", description: "West African Examinations Council", color: "from-emerald-500 to-teal-600" },
  { code: "neco", name: "NECO", description: "National Examinations Council", color: "from-blue-500 to-indigo-600" },
  { code: "jamb", name: "JAMB", description: "Joint Admissions & Matriculation Board", color: "from-purple-500 to-fuchsia-600" },
  { code: "ielts", name: "IELTS", description: "International English Language Testing", color: "from-amber-500 to-orange-600", comingSoon: true },
  { code: "sat", name: "SAT", description: "Scholastic Assessment Test", color: "from-rose-500 to-red-600", comingSoon: true },
];

const ExamPrep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setChecking(false); return; }
      // Only SS1-SS3 students and Super Admins.
      if ((user as any).is_super_admin) {
        if (!cancelled) { setEligible(true); setChecking(false); }
        return;
      }
      if ((user as any).role !== 'student') {
        if (!cancelled) { setEligible(false); setChecking(false); }
        return;
      }
      // First check the in-memory user (already populated from profiles).
      console.log('[ExamPrep] auth user:', user);
      let ok = checkEligible(
        (user as any).role,
        (user as any).sector,
        (user as any).class_grade,
        (user as any).is_super_admin,
      );
      console.log('[ExamPrep] initial eligibility:', ok, {
        role: (user as any).role,
        sector: (user as any).sector,
        class_grade: (user as any).class_grade,
        is_super_admin: (user as any).is_super_admin,
      });
      // Fallback: re-query profile in case auth context is stale.
      if (!ok) {
        const { data } = await supabase
          .from('profiles')
          .select('sector, class_grade')
          .eq('id', user.id)
          .maybeSingle();
        console.log('[ExamPrep] profile fallback data:', data);
        ok = checkEligible(
          'student',
          (data as any)?.sector,
          (data as any)?.class_grade,
          false,
        );
        console.log('[ExamPrep] fallback eligibility:', ok, {
          sector: (data as any)?.sector,
          class_grade: (data as any)?.class_grade,
        });
      }
      if (!cancelled) { setEligible(ok); setChecking(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!checking && !eligible && user) {
      toast.error("Access restricted to senior students only.");
      navigate('/dashboard', { replace: true });
    }
  }, [checking, eligible, user, navigate]);

  if (checking) return <LoadingScreen />;
  if (!eligible) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
            <GraduationCap className="h-5 w-5 text-primary" />
            Exam Prep
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-5xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Practice External Exams</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Choose an exam type to start practicing past questions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {EXAMS.map((exam) => (
            <Card
              key={exam.code}
              className={`relative overflow-hidden transition-all ${
                exam.comingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              }`}
              onClick={() => {
                if (!exam.comingSoon) navigate(`/student/exam-prep/${exam.code}`);
              }}
            >
              <div className={`h-2 bg-gradient-to-r ${exam.color}`} />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`p-2.5 rounded-lg bg-gradient-to-br ${exam.color} text-white flex-shrink-0`}
                  >
                    {exam.code === "ielts" || exam.code === "sat" ? (
                      <Globe className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  {exam.comingSoon && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" /> Coming Soon
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-lg">{exam.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {exam.description}
                </p>
                <Button
                  className="w-full mt-4"
                  variant={exam.comingSoon ? "outline" : "default"}
                  disabled={exam.comingSoon}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!exam.comingSoon) navigate(`/student/exam-prep/${exam.code}`);
                  }}
                >
                  {exam.comingSoon ? "Unavailable" : "Start Practicing"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ExamPrep;
