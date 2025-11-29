import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Send, BarChart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const ExamOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const examId = new URLSearchParams(location.search).get('examId');
  const examTitle = new URLSearchParams(location.search).get('title') || "Exam";

  const sections = [
    {
      title: "Set Up Test",
      description: "Give your test a name, write a short description, and choose what happens after grading.",
      icon: BookOpen,
      path: "/teacher/exam-setup",
      color: "text-primary"
    },
    {
      title: "Create Questions",
      description: "Add the questions your students will answer during the test.",
      icon: BookOpen,
      path: "/teacher/create-questions",
      color: "text-secondary"
    },
    {
      title: "Share Test",
      description: "Send the test link to your students and begin collecting their answers.",
      icon: Send,
      comingSoon: true,
      color: "text-accent"
    },
    {
      title: "Check Scores",
      description: "Review how each student performed and track their results.",
      icon: BarChart,
      comingSoon: true,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exam-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Exam Overview</h1>
            <h2 className="text-2xl font-semibold mt-2">{examTitle}</h2>
            <p className="text-muted-foreground mt-1">
              This is where you can set up your test, add questions, share it with students, and check their scores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => {
                if (section.comingSoon) {
                  toast.info(`${section.title} - Coming Soon Feature!`);
                } else if (section.path) {
                  if (section.path === "/teacher/create-questions" && examId) {
                    navigate(`${section.path}?examId=${examId}`);
                  } else {
                    navigate(section.path);
                  }
                }
              }}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamOverview;
