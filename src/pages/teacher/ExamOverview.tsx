import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Send, BarChart, CheckSquare, ToggleLeft, Hash, TextCursor, FileText, Upload, ListChecks } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BulkQuestionImport from "@/components/teacher/BulkQuestionImport";

const questionTypes = [
  { id: "multiple-choice", name: "Multiple Choice", icon: CheckSquare, description: "Single correct answer from 4 options" },
  { id: "multiple-response", name: "Multiple Response", icon: ListChecks, description: "Multiple correct answers allowed" },
  { id: "true-false", name: "True / False", icon: ToggleLeft, description: "Binary choice questions" },
  { id: "matching", name: "Matching / Ordering", icon: Hash, description: "Match or arrange items" },
  { id: "numeric", name: "Numeric", icon: Hash, description: "Numerical answer required" },
  { id: "fill-blank", name: "Fill in the Blank", icon: TextCursor, description: "Complete the sentence" },
  { id: "short-answer", name: "Short Answer", icon: FileText, description: "Brief text response" },
  { id: "essay", name: "Essay", icon: FileText, description: "Long-form written response" },
  { id: "file-upload", name: "File Upload", icon: Upload, description: "Upload document or image" },
];

const ExamOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const examId = new URLSearchParams(location.search).get('examId');
  const examTitle = new URLSearchParams(location.search).get('title') || "Exam";
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleQuestionTypeSelect = (typeId: string) => {
    setShowQuestionTypes(false);
    
    if (examId) {
      navigate(`/teacher/create-questions?examId=${examId}&type=${typeId}`);
    } else {
      toast.error("No exam selected. Please create an exam first.");
    }
  };

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
      action: () => setShowQuestionTypes(true),
      color: "text-secondary"
    },
    {
      title: "Bulk Import",
      description: "Import questions from CSV file for faster exam creation.",
      icon: Upload,
      action: () => setShowBulkImport(true),
      color: "text-accent"
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
    <div className="min-h-screen bg-background p-responsive">
      <div className="max-w-5xl mx-auto space-responsive">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/teacher/exam-builder')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-responsive-2xl font-bold">Exam Overview</h1>
            <h2 className="text-responsive-lg font-semibold mt-1">{examTitle}</h2>
            <p className="text-muted-foreground text-responsive-sm mt-1">
              Set up your test, add questions, share with students, and check scores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-responsive">
          {sections.map((section, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => {
                if (section.comingSoon) {
                  toast.info(`${section.title} - Coming Soon Feature!`);
                } else if (section.action) {
                  section.action();
                } else if (section.path) {
                  navigate(section.path);
                }
              }}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                    <section.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-responsive-base">{section.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-responsive-sm">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Question Type Selection Dialog */}
        <Dialog open={showQuestionTypes} onOpenChange={setShowQuestionTypes}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-responsive-lg">Select Question Type</DialogTitle>
              <DialogDescription className="text-responsive-sm">
                Choose the type of question you want to create for your exam
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
              {questionTypes.map((type) => (
                <Card
                  key={type.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 hover:ring-2 hover:ring-primary"
                  onClick={() => handleQuestionTypeSelect(type.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 sm:p-3 rounded-lg bg-muted mb-2 sm:mb-3">
                        <type.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-responsive-sm">{type.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Question Import</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import multiple questions at once
              </DialogDescription>
            </DialogHeader>
            {examId && (
              <BulkQuestionImport
                examId={examId}
                onImportComplete={() => {
                  setShowBulkImport(false);
                  toast.success("Questions imported successfully!");
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExamOverview;