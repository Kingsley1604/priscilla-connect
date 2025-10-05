import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CreateQuestions = () => {
  const navigate = useNavigate();

  const questionTypes = [
    {
      title: "Multiple Choice",
      description: "Students select one correct answer from multiple options",
      icon: FileText,
    },
    {
      title: "Multiple Response",
      description: "Students can select multiple correct answers",
      icon: FileText,
    },
    {
      title: "True / False",
      description: "Students choose between true or false",
      icon: FileText,
    },
    {
      title: "Matching / Ordering",
      description: "Students match items or put them in correct order",
      icon: FileText,
    },
    {
      title: "Numeric",
      description: "Students enter a numeric answer",
      icon: FileText,
    },
    {
      title: "Fill in the Blank",
      description: "Students complete sentences with missing words",
      icon: FileText,
    },
    {
      title: "Short Answer",
      description: "Students provide brief text responses",
      icon: FileText,
    },
    {
      title: "Essay",
      description: "Students write detailed essay responses",
      icon: FileText,
    },
    {
      title: "File Upload",
      description: "Students upload files as their answer",
      icon: FileText,
    }
  ];

  const handleQuestionTypeClick = (type: string) => {
    toast.info(`${type} question type - Coming Soon!`);
  };

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
              Select a question type to add to your exam
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionTypes.map((type, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => handleQuestionTypeClick(type.title)}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted text-primary">
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