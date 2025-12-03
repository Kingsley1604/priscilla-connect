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
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);

  const handleQuestionTypeSelect = (typeId: string) => {
    // Currently only multiple-choice is fully implemented
    if (typeId !== "multiple-choice") {
      toast.info(`${questionTypes.find(t => t.id === typeId)?.name} - Coming Soon!`);
      return;
    }
    
    setSelectedQuestionType(typeId);
    setShowQuestionTypes(false);
    
    if (examId) {
      navigate(`/teacher/create-questions?examId=${examId}&type=${typeId}`);
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
                } else if (section.action) {
                  section.action();
                } else if (section.path) {
                  navigate(section.path);
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

        {/* Question Type Selection Dialog */}
        <Dialog open={showQuestionTypes} onOpenChange={setShowQuestionTypes}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Question Type</DialogTitle>
              <DialogDescription>
                Choose the type of question you want to create for your exam
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {questionTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 ${
                    type.id === "multiple-choice" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleQuestionTypeSelect(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-lg bg-muted mb-3">
                        <type.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">{type.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      {type.id !== "multiple-choice" && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
          <DialogContent className="max-w-2xl">
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
