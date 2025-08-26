import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Award, BookOpen, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Reports = () => {
  const reportSections = [
    {
      title: "Entrance Result",
      description: "School admission test scores",
      icon: Award,
      color: "bg-gradient-primary",
      available: true
    },
    {
      title: "Midterm Result", 
      description: "Mid-semester examination scores",
      icon: FileText,
      color: "bg-gradient-secondary",
      available: true
    },
    {
      title: "Exam Result",
      description: "Final examination scores",
      icon: BookOpen,
      color: "bg-gradient-accent", 
      available: true
    },
    {
      title: "CBT Result",
      description: "Computer-based test preparation (Mock exams for SS3, JSS3, Primary 5&6)",
      icon: Brain,
      color: "bg-gradient-primary",
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-white/90">View your academic performance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* No Reports Available Message */}
          <Card className="shadow-soft border-dashed border-2 border-muted mb-8">
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Report Available</h3>
              <p className="text-muted-foreground">
                Reports will be available once your results are published by the school administration.
              </p>
            </CardContent>
          </Card>

          {/* Report Categories */}
          <h3 className="text-xl font-semibold mb-6 text-foreground">Report Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportSections.map((section) => (
              <Link 
                key={section.title}
                to={
                  section.title === "Exam Result" ? "/reports/exam-result" :
                  section.title === "Entrance Result" ? "/reports/entrance-result" :
                  section.title === "Midterm Result" ? "/reports/midterm-result" : "#"
                }
              >
                <Card className="shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer">
                  <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${section.color} shadow-soft`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {section.available ? "Available" : "Coming Soon"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{section.title}</CardTitle>
                  <CardDescription className="mb-4">{section.description}</CardDescription>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!section.available}
                    className="w-full"
                  >
                    {section.available ? "View Report" : "Not Available"}
                  </Button>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Information Section */}
          <Card className="mt-8 shadow-soft bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">About Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Entrance Result:</strong> Shows your admission test performance</li>
                <li>• <strong>Midterm Result:</strong> Displays mid-semester exam scores across all subjects</li>
                <li>• <strong>Exam Result:</strong> Contains final examination scores and overall grades</li>
                <li>• <strong>CBT Result:</strong> Mock examination results to prepare for external exams (JAMB, WAEC, NECO)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Reports;