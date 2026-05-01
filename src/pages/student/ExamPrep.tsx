import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, BookOpen, Globe, Lock } from "lucide-react";

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