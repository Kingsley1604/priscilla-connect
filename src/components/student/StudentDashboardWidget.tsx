import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, FileText, Trophy, Clock, TrendingUp } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";

interface UpcomingExam {
  id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  status: string;
}

interface HomeworkDeadline {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  class_level: string;
}

interface RecentGrade {
  subject: string;
  score: number;
  total: number;
  grade: string;
}

const StudentDashboardWidget = () => {
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [homework, setHomework] = useState<HomeworkDeadline[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load upcoming exams
      const { data: examsData } = await supabase
        .from("exams")
        .select("id, title, exam_type, duration_minutes, status")
        .eq("status", "active")
        .limit(5);

      setUpcomingExams(examsData || []);

      // Load homework deadlines
      const { data: homeworkData } = await supabase
        .from("homework")
        .select("id, title, subject, due_date, class_level")
        .eq("is_active", true)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      setHomework(homeworkData || []);

      // Load recent grades/results
      const { data: resultsData } = await supabase
        .from("student_results")
        .select("subject, total_score, grade")
        .eq("student_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (resultsData && resultsData.length > 0) {
        const grades = resultsData.map(r => ({
          subject: r.subject,
          score: r.total_score,
          total: 100,
          grade: r.grade
        }));
        setRecentGrades(grades);
        
        // Calculate overall progress
        const avgScore = grades.reduce((acc, g) => acc + g.score, 0) / grades.length;
        setOverallProgress(Math.round(avgScore));
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  };

  const getDeadlineColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    if (isBefore(due, now)) return "destructive";
    if (isBefore(due, threeDaysFromNow)) return "secondary";
    return "outline";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600 dark:text-green-400";
    if (grade.startsWith("B")) return "text-blue-600 dark:text-blue-400";
    if (grade.startsWith("C")) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted rounded-t-lg" />
            <CardContent className="h-40 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card className="shadow-soft bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Your Academic Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={overallProgress} className="h-3" />
            </div>
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Keep up the great work! You're making excellent progress.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Exams */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming exams scheduled
              </p>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{exam.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {exam.duration_minutes} mins
                    </div>
                  </div>
                  <Badge variant="outline">
                    {exam.exam_type === "entrance" ? "Entrance" : "CBT"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Homework Deadlines */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Homework Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {homework.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending homework
              </p>
            ) : (
              homework.map((hw) => (
                <div
                  key={hw.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">{hw.subject}</p>
                  </div>
                  <Badge variant={getDeadlineColor(hw.due_date)}>
                    {format(new Date(hw.due_date), "MMM dd")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Recent Grades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No grades available yet
              </p>
            ) : (
              recentGrades.map((grade, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{grade.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {grade.score}/{grade.total}
                    </p>
                  </div>
                  <span className={`font-bold text-lg ${getGradeColor(grade.grade)}`}>
                    {grade.grade}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboardWidget;
