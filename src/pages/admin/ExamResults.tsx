import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, Eye, Users, Trophy, Clock, Calendar, Trash2, Search, Filter, FileText, AlertCircle, ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamResult {
  id: string;
  score: number;
  percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  attempt_id: string;
  student_id: string;
  exam_id: string;
  exam_attempts: {
    token_number: string;
    submitted_at: string;
    answers: Record<string, string>;
    total_questions: number;
  };
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt' | 'termly';
    duration_minutes: number;
  };
}

interface ReportCardResult {
  id: string;
  student_name: string;
  admission_no: string;
  class_level: string;
  academic_session: string;
  term: string;
  status: string;
  created_at: string;
  created_by: string;
  teacher_name?: string;
  rejection_reason?: string;
  total_score_obtained?: number;
  percentage?: number;
  report_type: 'midterm' | 'termly';
}

interface SecondaryReportCard {
  id: string;
  student_name: string;
  admission_no: string;
  class_level: string;
  academic_session: string;
  term: string;
  status: string;
  created_at: string;
  created_by: string;
  teacher_name?: string;
  rejection_reason?: string;
  student_total_score?: number;
  student_average?: number;
  report_type: 'midterm' | 'termly';
}

interface ExamToken {
  id: string;
  token_number: string;
  student_id: string | null;
  used_at: string | null;
  created_at: string;
  exam_id: string;
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt' | 'termly';
  };
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  token_number: string;
  submitted_at: string;
  total_questions: number;
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt' | 'termly';
  };
}

interface TeacherFolder {
  teacherId: string;
  teacherName: string;
  className: string;
  midtermReports: (ReportCardResult | SecondaryReportCard)[];
  termlyReports: (ReportCardResult | SecondaryReportCard)[];
  isOpen: boolean;
}

const ExamResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardResult[]>([]);
  const [secondaryReports, setSecondaryReports] = useState<SecondaryReportCard[]>([]);
  const [tokens, setTokens] = useState<ExamToken[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'report_cards' | 'tokens' | 'attempts'>('results');
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [examsList, setExamsList] = useState<Array<{id: string, title: string, exam_type: string}>>([]);

  // View report dialog
  const [viewingReport, setViewingReport] = useState<ReportCardResult | SecondaryReportCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Rejection dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const [rejectingReportType, setRejectingReportType] = useState<'primary' | 'secondary' | null>(null);

  // Teacher folders state
  const [teacherFolders, setTeacherFolders] = useState<TeacherFolder[]>([]);

  // Filter states
  const [tokenFilter, setTokenFilter] = useState<'all' | 'used' | 'available' | 'expired'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'draft'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Token creation form
  const [newToken, setNewToken] = useState({
    exam_id: "",
    token_number: "",
    count: 1
  });

  useEffect(() => {
    loadData();
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("id, title, exam_type")
        .eq("status", "active");

      if (error) throw error;
      setExamsList(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
    }
  };

  const loadData = async () => {
    try {
      // Load exam results (CBT/Entrance)
      const { data: resultsData, error: resultsError } = await supabase
        .from("exam_results")
        .select(`
          *,
          exam_attempts!inner (
            token_number,
            submitted_at,
            answers,
            total_questions
          ),
          exams!inner (
            title,
            exam_type,
            duration_minutes
          )
        `)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;
      setResults((resultsData || []).map(result => ({
        ...result,
        exam_attempts: {
          ...result.exam_attempts,
          answers: result.exam_attempts.answers as Record<string, string>
        }
      })));

      // Load primary/nursery report cards (midterm and termly)
      const { data: reportCardsData, error: reportCardsError } = await supabase
        .from("report_cards")
        .select(`
          id,
          student_name,
          admission_no,
          class_level,
          academic_session,
          term,
          created_at,
          created_by,
          total_score_obtained,
          percentage
        `)
        .order("created_at", { ascending: false });

      if (reportCardsError) throw reportCardsError;

      // Get teacher names for report cards
      const teacherIds = [...new Set((reportCardsData || []).map(r => r.created_by))];
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', teacherIds);

      const teacherMap = new Map(teachers?.map(t => [t.id, t.name]) || []);

      const processedReportCards = (reportCardsData || []).map(rc => ({
        ...rc,
        status: 'pending',
        teacher_name: teacherMap.get(rc.created_by) || 'Unknown Teacher',
        report_type: rc.term?.toLowerCase().includes('mid') ? 'midterm' as const : 'termly' as const
      }));
      setReportCards(processedReportCards);

      // Load secondary report cards
      const { data: secondaryData, error: secondaryError } = await supabase
        .from("secondary_report_cards")
        .select(`
          id,
          student_name,
          admission_no,
          class_level,
          academic_session,
          term,
          status,
          created_at,
          created_by,
          rejection_reason,
          student_total_score,
          student_average
        `)
        .order("created_at", { ascending: false });

      if (secondaryError) throw secondaryError;

      // Get teacher names for secondary reports
      const secondaryTeacherIds = [...new Set((secondaryData || []).map(r => r.created_by))];
      const { data: secondaryTeachers } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', secondaryTeacherIds);

      const secondaryTeacherMap = new Map(secondaryTeachers?.map(t => [t.id, t.name]) || []);

      const processedSecondaryReports = (secondaryData || []).map(sr => ({
        ...sr,
        teacher_name: secondaryTeacherMap.get(sr.created_by) || 'Unknown Teacher',
        report_type: sr.term?.toLowerCase().includes('mid') ? 'midterm' as const : 'termly' as const
      }));
      setSecondaryReports(processedSecondaryReports);

      // Organize reports into teacher folders
      organizeIntoFolders(processedReportCards, processedSecondaryReports);

      // Load tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from("exam_tokens")
        .select(`
          *,
          exams!inner (
            title,
            exam_type
          )
        `)
        .order("created_at", { ascending: false });

      if (tokensError) throw tokensError;
      setTokens(tokensData || []);

      // Load recent attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select(`
          *,
          exams!inner (
            title,
            exam_type
          )
        `)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(50);

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData || []);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const organizeIntoFolders = (
    primaryReports: ReportCardResult[],
    secondaryReportsData: SecondaryReportCard[]
  ) => {
    const folderMap = new Map<string, TeacherFolder>();

    // Process primary reports
    primaryReports.forEach(report => {
      const key = `${report.created_by}-${report.class_level}`;
      if (!folderMap.has(key)) {
        folderMap.set(key, {
          teacherId: report.created_by,
          teacherName: report.teacher_name || 'Unknown Teacher',
          className: report.class_level,
          midtermReports: [],
          termlyReports: [],
          isOpen: false
        });
      }
      const folder = folderMap.get(key)!;
      if (report.report_type === 'midterm') {
        folder.midtermReports.push(report);
      } else {
        folder.termlyReports.push(report);
      }
    });

    // Process secondary reports
    secondaryReportsData.forEach(report => {
      const key = `${report.created_by}-${report.class_level}`;
      if (!folderMap.has(key)) {
        folderMap.set(key, {
          teacherId: report.created_by,
          teacherName: report.teacher_name || 'Unknown Teacher',
          className: report.class_level,
          midtermReports: [],
          termlyReports: [],
          isOpen: false
        });
      }
      const folder = folderMap.get(key)!;
      if (report.report_type === 'midterm') {
        folder.midtermReports.push(report);
      } else {
        folder.termlyReports.push(report);
      }
    });

    setTeacherFolders(Array.from(folderMap.values()));
  };

  const toggleFolder = (index: number) => {
    setTeacherFolders(prev => prev.map((folder, i) => 
      i === index ? { ...folder, isOpen: !folder.isOpen } : folder
    ));
  };

  const createTokens = async () => {
    if (!newToken.exam_id || !newToken.token_number.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const tokens = [];
      for (let i = 0; i < newToken.count; i++) {
        const tokenNumber = newToken.count === 1 
          ? newToken.token_number 
          : `${newToken.token_number}-${(i + 1).toString().padStart(3, '0')}`;
        
        tokens.push({
          exam_id: newToken.exam_id,
          token_number: tokenNumber,
          created_by: user.user.id
        });
      }

      const { error } = await supabase
        .from("exam_tokens")
        .insert(tokens);

      if (error) throw error;

      toast.success(`${newToken.count} token(s) created successfully!`);
      setIsCreateTokenOpen(false);
      setNewToken({ exam_id: "", token_number: "", count: 1 });
      loadData();
    } catch (error: any) {
      console.error("Error creating tokens:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Token number already exists");
      } else {
        toast.error("Failed to create tokens");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this token?")) return;

    try {
      const { error } = await supabase
        .from("exam_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;
      toast.success("Token deleted successfully!");
      loadData();
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("Failed to delete token");
    }
  };

  const calculateScore = async (result: ExamResult) => {
    try {
      const { data: questions, error } = await supabase
        .from("exam_questions")
        .select("id, correct_answer")
        .eq("exam_id", result.exam_id);

      if (error) throw error;

      let correctCount = 0;
      const answers = result.exam_attempts.answers;

      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          correctCount++;
        }
      });

      const percentage = (correctCount / questions.length) * 100;

      return {
        score: correctCount,
        totalQuestions: questions.length,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error("Error calculating score:", error);
      return null;
    }
  };

  const approveExamResult = async (resultId: string, action: 'approved' | 'rejected') => {
    try {
      const result = results.find(r => r.id === resultId);
      if (!result) return;

      let updateData: any = {
        status: action,
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (action === 'approved' && result.score === 0) {
        const scoreData = await calculateScore(result);
        if (scoreData) {
          updateData.score = scoreData.score;
          updateData.percentage = scoreData.percentage;
        }
      }

      const { error } = await supabase
        .from("exam_results")
        .update(updateData)
        .eq("id", resultId);

      if (error) throw error;

      toast.success(`Result ${action} successfully!`);
      loadData();
    } catch (error) {
      console.error("Error updating result:", error);
      toast.error("Failed to update result");
    }
  };

  const notifyTeacher = async (teacherId: string, action: 'approved' | 'rejected', studentName: string, className: string) => {
    try {
      // Create notification for teacher
      await supabase.from('admin_notifications').insert({
        title: action === 'approved' ? 'Report Approved' : 'Report Rejected',
        message: action === 'approved' 
          ? `Your result for ${studentName} (${className}) has been approved and published.`
          : `Your result for ${studentName} (${className}) has been rejected. Please check the rejection reason and resubmit.`,
        type: action === 'approved' ? 'report_approved' : 'report_rejected',
        target_admin_id: teacherId
      });
    } catch (error) {
      console.error('Error sending notification to teacher:', error);
    }
  };

  const approveReportCard = async (reportId: string, type: 'primary' | 'secondary', report: ReportCardResult | SecondaryReportCard) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (type === 'secondary') {
        const { error } = await supabase
          .from("secondary_report_cards")
          .update({
            status: 'published',
            approved_at: new Date().toISOString(),
            approved_by: user.user.id,
            published_at: new Date().toISOString()
          })
          .eq("id", reportId);

        if (error) throw error;
      }

      // Notify teacher
      await notifyTeacher(report.created_by, 'approved', report.student_name, report.class_level);
      
      toast.success("Report card approved and published!");
      loadData();
    } catch (error) {
      console.error("Error approving report:", error);
      toast.error("Failed to approve report card");
    }
  };

  const openRejectDialog = (reportId: string, type: 'primary' | 'secondary') => {
    setRejectingReportId(reportId);
    setRejectingReportType(type);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectReportCard = async () => {
    if (!rejectingReportId || !rejectingReportType) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      let report: ReportCardResult | SecondaryReportCard | undefined;

      if (rejectingReportType === 'secondary') {
        report = secondaryReports.find(r => r.id === rejectingReportId);
        const { error } = await supabase
          .from("secondary_report_cards")
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason,
            approved_at: null,
            approved_by: null
          })
          .eq("id", rejectingReportId);

        if (error) throw error;
      } else {
        report = reportCards.find(r => r.id === rejectingReportId);
      }

      // Notify teacher about rejection
      if (report) {
        await notifyTeacher(report.created_by, 'rejected', report.student_name, report.class_level);
      }
      
      toast.success("Report card rejected and returned to teacher as draft");
      setIsRejectDialogOpen(false);
      setRejectingReportId(null);
      setRejectingReportType(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast.error("Failed to reject report card");
    }
  };

  const viewReportDetails = (report: ReportCardResult | SecondaryReportCard) => {
    setViewingReport(report);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      published: 'default',
      draft: 'outline',
      submitted: 'secondary'
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      published: 'Published',
      draft: 'Draft',
      submitted: 'Submitted'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Check if token is expired (older than 30 days and unused)
  const isTokenExpired = (token: ExamToken) => {
    if (token.used_at) return false;
    const createdDate = new Date(token.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate < thirtyDaysAgo;
  };

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.exams.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (tokenFilter) {
      case 'used': return token.used_at !== null;
      case 'available': return token.used_at === null && !isTokenExpired(token);
      case 'expired': return isTokenExpired(token);
      default: return true;
    }
  });

  // Filter exam results
  const filteredResults = results.filter(result => {
    const matchesSearch = result.exam_attempts.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.exams.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (resultFilter !== 'all' && result.status !== resultFilter) return false;
    
    return true;
  });

  // Filter report cards
  const filteredReportCards = reportCards.filter(rc => {
    const matchesSearch = rc.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rc.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rc.class_level.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (reportFilter !== 'all' && rc.status !== reportFilter) return false;
    
    return true;
  });

  // Filter secondary reports
  const filteredSecondaryReports = secondaryReports.filter(sr => {
    const matchesSearch = sr.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sr.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sr.class_level.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (reportFilter !== 'all' && sr.status !== reportFilter) return false;
    
    return true;
  });

  // Filter teacher folders based on search
  const filteredTeacherFolders = teacherFolders.filter(folder => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return folder.teacherName.toLowerCase().includes(searchLower) ||
           folder.className.toLowerCase().includes(searchLower) ||
           folder.midtermReports.some(r => r.student_name.toLowerCase().includes(searchLower)) ||
           folder.termlyReports.some(r => r.student_name.toLowerCase().includes(searchLower));
  });

  const pendingResults = results.filter(r => r.status === 'pending');
  const pendingReports = [...reportCards.filter(r => r.status === 'pending'), ...secondaryReports.filter(r => r.status === 'submitted' || r.status === 'pending')];
  const approvedResults = results.filter(r => r.status === 'approved');
  const totalAttempts = attempts.length;
  const totalTokens = tokens.length;
  const usedTokens = tokens.filter(t => t.used_at).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl sm:text-3xl font-bold">Result Management</h1>
            </div>
            
            <Dialog open={isCreateTokenOpen} onOpenChange={setIsCreateTokenOpen}>
              <DialogTrigger asChild>
                <Button>Create Exam Tokens</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Exam Tokens</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exam">Select Exam</Label>
                    <select 
                      id="exam"
                      value={newToken.exam_id}
                      onChange={(e) => setNewToken(prev => ({ ...prev, exam_id: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="">Select an exam...</option>
                      {examsList.map(exam => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title} ({exam.exam_type.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="token_number">Base Token Number</Label>
                    <Input
                      id="token_number"
                      value={newToken.token_number}
                      onChange={(e) => setNewToken(prev => ({ ...prev, token_number: e.target.value }))}
                      placeholder="e.g., ENT2024"
                    />
                  </div>

                  <div>
                    <Label htmlFor="count">Number of Tokens</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="100"
                      value={newToken.count}
                      onChange={(e) => setNewToken(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <Button onClick={createTokens} disabled={isLoading} className="w-full">
                    {isLoading ? "Creating..." : `Create ${newToken.count} Token(s)`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Exams</p>
                  <p className="text-xl sm:text-2xl font-bold">{pendingResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Reports</p>
                  <p className="text-xl sm:text-2xl font-bold">{pendingReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                  <p className="text-xl sm:text-2xl font-bold">{approvedResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Attempts</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Used Tokens</p>
                  <p className="text-xl sm:text-2xl font-bold">{usedTokens}/{totalTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, token, or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {activeTab === 'tokens' && (
                <Select value={tokenFilter} onValueChange={(v: any) => setTokenFilter(v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter tokens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tokens</SelectItem>
                    <SelectItem value="used">Used Tokens</SelectItem>
                    <SelectItem value="available">Available Tokens</SelectItem>
                    <SelectItem value="expired">Expired Tokens</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {activeTab === 'results' && (
                <Select value={resultFilter} onValueChange={(v: any) => setResultFilter(v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {activeTab === 'report_cards' && (
                <Select value={reportFilter} onValueChange={(v: any) => setReportFilter(v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter reports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">Exam Results</TabsTrigger>
            <TabsTrigger value="report_cards">Report Cards</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="attempts">Attempts</TabsTrigger>
          </TabsList>

          {/* Exam Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>CBT & Entrance Exam Results ({filteredResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-medium">{result.exams.title}</h4>
                            <Badge variant={result.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                              {result.exams.exam_type.toUpperCase()}
                            </Badge>
                            {getStatusBadge(result.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Token:</span> {result.exam_attempts.token_number}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {formatDate(result.exam_attempts.submitted_at)}
                            </div>
                            <div>
                              <span className="font-medium">Score:</span> {result.score}/{result.exam_attempts.total_questions}
                            </div>
                            <div>
                              <span className="font-medium">Percentage:</span> {result.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Exam Attempt Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Exam:</strong> {result.exams.title}</div>
                                  <div><strong>Token:</strong> {result.exam_attempts.token_number}</div>
                                  <div><strong>Type:</strong> {result.exams.exam_type.toUpperCase()}</div>
                                  <div><strong>Duration:</strong> {result.exams.duration_minutes} minutes</div>
                                  <div><strong>Score:</strong> {result.score}/{result.exam_attempts.total_questions}</div>
                                  <div><strong>Percentage:</strong> {result.percentage.toFixed(1)}%</div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Student Answers:</h4>
                                  <div className="max-h-60 overflow-y-auto space-y-2">
                                    {Object.entries(result.exam_attempts.answers).map(([questionId, answer], index) => (
                                      <div key={questionId} className="text-sm p-2 bg-muted rounded">
                                        <strong>Q{index + 1}:</strong> Answer {answer?.toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {result.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveExamResult(result.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => approveExamResult(result.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No exam results found</p>
                      <p className="text-sm">Results will appear here when students complete CBT or entrance exams</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Cards Tab - Organized by Teacher Folders */}
          <TabsContent value="report_cards">
            <Card>
              <CardHeader>
                <CardTitle>Teacher-Uploaded Report Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredTeacherFolders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No report cards found</p>
                        <p className="text-sm">Teacher-uploaded results will appear here for approval</p>
                      </div>
                    ) : (
                      filteredTeacherFolders.map((folder, folderIndex) => (
                        <Collapsible 
                          key={`${folder.teacherId}-${folder.className}`}
                          open={folder.isOpen}
                          onOpenChange={() => toggleFolder(folderIndex)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                              <div className="flex items-center gap-3">
                                {folder.isOpen ? (
                                  <FolderOpen className="h-5 w-5 text-primary" />
                                ) : (
                                  <Folder className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="font-medium">{folder.teacherName}</p>
                                  <p className="text-sm text-muted-foreground">{folder.className}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {folder.midtermReports.length + folder.termlyReports.length} reports
                                </Badge>
                                {folder.isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="ml-4 mt-2 space-y-3 border-l-2 border-muted pl-4">
                              {/* Mid Term Reports Subfolder */}
                              {folder.midtermReports.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-600">
                                    <FileText className="h-4 w-4" />
                                    Mid Term Report ({folder.midtermReports.length})
                                  </div>
                                  <div className="space-y-2">
                                    {folder.midtermReports.map((report) => (
                                      <ReportCardItem
                                        key={report.id}
                                        report={report}
                                        onView={() => viewReportDetails(report)}
                                        onApprove={() => approveReportCard(report.id, 'student_average' in report ? 'secondary' : 'primary', report)}
                                        onReject={() => openRejectDialog(report.id, 'student_average' in report ? 'secondary' : 'primary')}
                                        getStatusBadge={getStatusBadge}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Termly Examination Reports Subfolder */}
                              {folder.termlyReports.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-600">
                                    <FileText className="h-4 w-4" />
                                    Termly Examination Report ({folder.termlyReports.length})
                                  </div>
                                  <div className="space-y-2">
                                    {folder.termlyReports.map((report) => (
                                      <ReportCardItem
                                        key={report.id}
                                        report={report}
                                        onView={() => viewReportDetails(report)}
                                        onApprove={() => approveReportCard(report.id, 'student_average' in report ? 'secondary' : 'primary', report)}
                                        onReject={() => openRejectDialog(report.id, 'student_average' in report ? 'secondary' : 'primary')}
                                        getStatusBadge={getStatusBadge}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>Exam Tokens ({filteredTokens.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTokens.map((token) => (
                    <div 
                      key={token.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 group hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{token.token_number}</span>
                          <Badge variant={token.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                            {token.exams.exam_type.toUpperCase()}
                          </Badge>
                          <Badge variant={
                            token.used_at ? 'destructive' : 
                            isTokenExpired(token) ? 'secondary' : 'default'
                          }>
                            {token.used_at ? 'Used' : isTokenExpired(token) ? 'Expired' : 'Available'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {token.exams.title} • Created {formatDate(token.created_at)}
                          {token.used_at && ` • Used ${formatDate(token.used_at)}`}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center"
                        onClick={() => deleteToken(token.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {filteredTokens.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tokens found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attempts Tab */}
          <TabsContent value="attempts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Exam Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{attempt.exams.title}</span>
                          <Badge variant={attempt.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                            {attempt.exams.exam_type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Token: {attempt.token_number} • 
                          Submitted: {formatDate(attempt.submitted_at)} • 
                          {attempt.total_questions} questions
                        </div>
                      </div>
                    </div>
                  ))}

                  {attempts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No exam attempts found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Card Details</DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Student Name</Label>
                  <p className="font-medium">{viewingReport.student_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Admission No</Label>
                  <p className="font-medium">{viewingReport.admission_no}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Class</Label>
                  <p className="font-medium">{viewingReport.class_level}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Term</Label>
                  <p className="font-medium">{viewingReport.term}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Academic Session</Label>
                  <p className="font-medium">{viewingReport.academic_session}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingReport.status)}</div>
                </div>
                {'student_average' in viewingReport && viewingReport.student_average && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Average Score</Label>
                    <p className="font-medium">{viewingReport.student_average.toFixed(1)}%</p>
                  </div>
                )}
                {'percentage' in viewingReport && viewingReport.percentage && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Percentage</Label>
                    <p className="font-medium">{viewingReport.percentage}%</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Teacher</Label>
                <p className="font-medium">{viewingReport.teacher_name}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Submitted</Label>
                <p className="font-medium">{formatDate(viewingReport.created_at)}</p>
              </div>

              {viewingReport.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Label className="text-destructive text-sm">Rejection Reason</Label>
                  <p className="text-destructive">{viewingReport.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {viewingReport && (viewingReport.status === 'submitted' || viewingReport.status === 'pending') && (
              <>
                <Button
                  onClick={() => {
                    approveReportCard(viewingReport.id, 'student_average' in viewingReport ? 'secondary' : 'primary', viewingReport);
                    setIsViewDialogOpen(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openRejectDialog(viewingReport.id, 'student_average' in viewingReport ? 'secondary' : 'primary');
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report Card</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this report card. The teacher will see this reason and can correct and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection (e.g., incorrect scores, missing subjects, etc.)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectReportCard}
              disabled={!rejectionReason.trim()}
            >
              Reject Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Report Card Item Component
const ReportCardItem = ({ 
  report, 
  onView, 
  onApprove, 
  onReject,
  getStatusBadge 
}: { 
  report: ReportCardResult | SecondaryReportCard;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const isSecondary = 'student_average' in report;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border rounded-lg gap-3">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium">{report.student_name}</span>
          <Badge variant="outline" className="text-xs">{report.admission_no}</Badge>
          {getStatusBadge(report.status)}
        </div>
        <div className="text-xs text-muted-foreground">
          {report.term} • {report.academic_session}
          {isSecondary && (report as SecondaryReportCard).student_average && (
            <span> • Avg: {(report as SecondaryReportCard).student_average?.toFixed(1)}%</span>
          )}
        </div>
        {report.rejection_reason && (
          <div className="mt-1 text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {report.rejection_reason}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onView}>
          <Eye className="w-4 h-4" />
        </Button>
        {(report.status === 'submitted' || report.status === 'pending') && (
          <>
            <Button size="sm" onClick={onApprove}>
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onReject}>
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamResults;
