import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Award, BookOpen, Brain, Upload, AlertTriangle, FileEdit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ResultCodeChecker from "@/components/reports/ResultCodeChecker";
import ClassResultsView from "./reports/ClassResultsView";

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'student';
  const [checkerOpen, setCheckerOpen] = useState<'entrance' | 'midterm' | 'exam' | null>(null);
  const [classViewOpen, setClassViewOpen] = useState<'entrance' | 'midterm' | 'exam' | null>(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [draftCount, setDraftCount] = useState(0);

  // Check if teacher is a class teacher
  useEffect(() => {
    const checkClassTeacherStatus = async () => {
      if (!user || userRole !== 'teacher') {
        setIsLoadingAccess(false);
        return;
      }

      try {
        const { data: assignments } = await supabase
          .from('teacher_assignments')
          .select('is_class_teacher')
          .eq('teacher_id', user.id)
          .eq('is_active', true)
          .eq('is_class_teacher', true);

        setIsClassTeacher((assignments && assignments.length > 0) || false);
      } catch (error) {
        console.error('Error checking class teacher status:', error);
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkClassTeacherStatus();
  }, [user, userRole]);

  // Load draft count for teachers
  useEffect(() => {
    const loadDraftCount = async () => {
      if (!user || userRole !== 'teacher') return;

      try {
        // Count primary drafts
        const { count: primaryCount } = await supabase
          .from('report_cards')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id);

        // Count secondary drafts/rejected
        const { count: secondaryCount } = await supabase
          .from('secondary_report_cards')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .in('status', ['draft', 'rejected']);

        setDraftCount((primaryCount || 0) + (secondaryCount || 0));
      } catch (error) {
        console.error('Error loading draft count:', error);
      }
    };

    loadDraftCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('draft-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards' }, loadDraftCount)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secondary_report_cards' }, loadDraftCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, userRole]);

  const reportSections = [
    {
      title: "Entrance Result",
      description: "School admission test scores",
      icon: Award,
      color: "bg-gradient-primary",
      available: true,
      key: 'entrance' as const
    },
    {
      title: "Midterm Result", 
      description: "Mid-semester examination scores",
      icon: FileText,
      color: "bg-gradient-secondary",
      available: true,
      key: 'midterm' as const
    },
    {
      title: "Exam Result",
      description: "Final examination scores",
      icon: BookOpen,
      color: "bg-gradient-accent", 
      available: true,
      key: 'exam' as const
    },
    {
      title: "CBT Result",
      description: "Computer-based test preparation (Mock exams for SS3, JSS3, Primary 5&6)",
      icon: Brain,
      color: "bg-gradient-primary",
      available: false,
      key: null
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
            
            {/* Teacher Upload Result Button - Only for class teachers */}
            {userRole === 'teacher' && isClassTeacher && (
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

      {/* Access Restriction for non-class teachers */}
      {userRole === 'teacher' && !isLoadingAccess && !isClassTeacher && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-soft border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Only class teachers can upload and manage student reports. 
                  Please contact an administrator if you believe this is an error.
                </p>
                <Link to="/">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Content - Show for students, class teachers, and admins */}
      {(userRole === 'student' || userRole === 'admin' || (userRole === 'teacher' && isClassTeacher)) && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* No Reports Available Message - for students only */}
            {userRole === 'student' && (
              <Card className="shadow-soft border-dashed border-2 border-muted mb-8">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Report Available</h3>
                  <p className="text-muted-foreground">
                    Reports will be available once your results are published by the school administration.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Report Categories */}
            <h3 className="text-xl font-semibold mb-6 text-foreground">Report Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportSections.map((section) => (
                <div 
                  key={section.title}
                  onClick={() => {
                    if (section.available && section.key) {
                      if ((userRole === 'teacher' && isClassTeacher) || userRole === 'admin') {
                        setClassViewOpen(section.key);
                      } else {
                        setCheckerOpen(section.key);
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

              {/* Drafts Category - Only for teachers */}
              {userRole === 'teacher' && isClassTeacher && (
                <div onClick={() => navigate('/teacher/draft-results')}>
                  <Card className="shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer border-dashed border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-3 rounded-lg bg-muted shadow-soft">
                          <FileEdit className="h-6 w-6 text-muted-foreground" />
                        </div>
                        {draftCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">{draftCount} Draft(s)</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No Drafts</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-2">Drafts</CardTitle>
                      <CardDescription className="mb-4">
                        Unfinished or rejected results awaiting correction
                      </CardDescription>
                      <Button variant="outline" size="sm" className="w-full">
                        View Drafts
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                  {userRole === 'teacher' && (
                    <li>• <strong>Drafts:</strong> Contains saved drafts and admin-rejected results for correction and resubmission</li>
                  )}
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

            {/* Class Results View for Class Teachers/Admins */}
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
      )}
    </div>
  );
};

export default Reports;