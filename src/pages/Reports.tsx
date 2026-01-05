import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Award, BookOpen, Brain, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ResultCodeChecker from "@/components/reports/ResultCodeChecker";
import ClassResultsView from "./reports/ClassResultsView";
import { useState } from "react";

const Reports = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'student';
  const [checkerOpen, setCheckerOpen] = useState<'entrance' | 'midterm' | 'exam' | null>(null);
  const [classViewOpen, setClassViewOpen] = useState<'entrance' | 'midterm' | 'exam' | null>(null);
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
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 px-2 sm:px-3 flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Reports</h1>
                <p className="text-white/90 text-xs sm:text-sm">View your academic performance</p>
              </div>
            </div>
            
            {/* Teacher Upload Result Button */}
            {userRole === 'teacher' && (
              <Link to="/teacher/upload-result">
                <Button className="bg-green-600 hover:bg-green-700 text-sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Result
                </Button>
              </Link>
            )}
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
              <div 
                key={section.title}
                onClick={() => {
                  if (section.available) {
                    // Teachers and admins see class selection, students see result code checker
                    if (userRole === 'teacher' || userRole === 'admin') {
                      if (section.title === "Entrance Result") setClassViewOpen('entrance');
                      else if (section.title === "Midterm Result") setClassViewOpen('midterm');
                      else if (section.title === "Exam Result") setClassViewOpen('exam');
                    } else {
                      if (section.title === "Entrance Result") setCheckerOpen('entrance');
                      else if (section.title === "Midterm Result") setCheckerOpen('midterm');
                      else if (section.title === "Exam Result") setCheckerOpen('exam');
                    }
                  }
                }}
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
              </div>
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

          {/* Result Code Checkers for Students */}
          {checkerOpen && (
            <ResultCodeChecker
              examType={checkerOpen}
              isOpen={!!checkerOpen}
              onClose={() => setCheckerOpen(null)}
            />
          )}

          {/* Class Results View for Teachers/Admins */}
          {classViewOpen && (
            <div className="fixed inset-0 bg-background z-50">
              <ClassResultsView
                examType={classViewOpen}
                onBack={() => setClassViewOpen(null)}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;