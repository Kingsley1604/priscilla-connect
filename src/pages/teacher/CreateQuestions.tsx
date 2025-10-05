import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckSquare, CircleDot, ArrowLeftRight, Hash, Type, AlignLeft, FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateQuestions = () => {
  const navigate = useNavigate();

  const questionTypes = [
    {
      title: "Multiple Choice",
      description: "Students select one correct answer from multiple options",
      icon: CircleDot,
      path: "/teacher/question-multiple-choice",
      color: "text-blue-600"
    },
    {
      title: "Multiple Response",
      description: "Students can select multiple correct answers",
      icon: CheckSquare,
      path: "/teacher/question-multiple-response",
      color: "text-green-600"
    },
    {
      title: "True / False",
      description: "Students choose between true or false",
      icon: CheckSquare,
      path: "/teacher/question-true-false",
      color: "text-purple-600"
    },
    {
      title: "Matching / Ordering",
      description: "Students match items or put them in correct order",
      icon: ArrowLeftRight,
      path: "/teacher/question-matching",
      color: "text-orange-600"
    },
    {
      title: "Numeric",
      description: "Students enter a numeric answer",
      icon: Hash,
      path: "/teacher/question-numeric",
      color: "text-red-600"
    },
    {
      title: "Fill in the Blank",
      description: "Students complete sentences with missing words",
      icon: Type,
      path: "/teacher/question-fill-blank",
      color: "text-indigo-600"
    },
    {
      title: "Short Answer",
      description: "Students provide brief text responses",
      icon: AlignLeft,
      path: "/teacher/question-short-answer",
      color: "text-teal-600"
    },
    {
      title: "Essay",
      description: "Students write detailed long-form responses",
      icon: FileText,
      path: "/teacher/question-essay",
      color: "text-pink-600"
    },
    {
      title: "File Upload",
      description: "Students upload files as their answer",
      icon: FileUp,
      path: "/teacher/question-file-upload",
      color: "text-cyan-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exam-overview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Questions</h1>
            <p className="text-muted-foreground mt-1">
              Choose the type of question you want to create for your test
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionTypes.map((type, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => navigate(type.path)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-lg bg-muted ${type.color}`}>
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateQuestions;
