import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, Edit, FileText, Users, EyeOff, Copy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ExamItem {
  id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  created_by: string;
  marks_per_question: number | null;
  total_marks: number | null;
  randomize_questions: boolean;
  submitted_for_approval_at: string | null;
  exam_token: string | null;
  question_count?: number;
  teacher_name?: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  question_order: number;
}

const ManageExamination = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editDuration, setEditDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'unpublished' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (exam) => {
          const { count } = await supabase
            .from("exam_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_id", exam.id);

          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", exam.created_by)
            .maybeSingle();

          return {
            ...exam,
            question_count: count || 0,
            teacher_name: profile?.name || "Unknown",
          };
        })
      );

      setExams(enriched as any);
    } catch (error) {
      console.error("Error loading exams:", error);
      toast.error("Failed to load exams");
    }
  };

  const loadQuestions = async (examId: string) => {
    const { data, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("exam_id", examId)
      .order("question_order");

    if (error) {
      toast.error("Failed to load questions");
      return;
    }
    setQuestions(data || []);
  };

  const previewExam = async (exam: ExamItem) => {
    setSelectedExam(exam);
    setEditDuration(exam.duration_minutes);
    await loadQuestions(exam.id);
    setIsPreviewOpen(true);
  };

  const approveExam = async () => {
    if (!selectedExam) return;
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from("exams")
        .update({
          status: "active" as any,
          duration_minutes: editDuration,
          approved_by: user.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedExam.id);

      if (error) throw error;

      await supabase.from("exam_approval_notifications").insert({
        exam_id: selectedExam.id,
        teacher_id: selectedExam.created_by,
        teacher_name: selectedExam.teacher_name || "Teacher",
        exam_title: selectedExam.title,
        exam_type: selectedExam.exam_type,
        action: "approved",
        admin_id: user.user.id,
      });

      await supabase.from("admin_notifications").insert({
        title: "Exam Approved & Published",
        message: `"${selectedExam.title}" has been approved and published.`,
        type: "exam_approved",
        target_admin_id: selectedExam.created_by,
      });

      toast.success("Exam approved and published!");
      setIsPreviewOpen(false);
      setSelectedExam(null);
      loadExams();
    } catch (error) {
      console.error("Error approving exam:", error);
      toast.error("Failed to approve exam");
    } finally {
      setIsLoading(false);
    }
  };

  const rejectExam = async () => {
    if (!selectedExam || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from("exams")
        .update({
          status: "rejected" as any,
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedExam.id);

      if (error) throw error;

      await supabase.from("exam_approval_notifications").insert({
        exam_id: selectedExam.id,
        teacher_id: selectedExam.created_by,
        teacher_name: selectedExam.teacher_name || "Teacher",
        exam_title: selectedExam.title,
        exam_type: selectedExam.exam_type,
        action: "rejected",
        admin_id: user.user.id,
        admin_comment: rejectionReason,
      });

      await supabase.from("admin_notifications").insert({
        title: "Exam Rejected",
        message: `"${selectedExam.title}" has been rejected. Reason: ${rejectionReason}`,
        type: "exam_rejected",
        target_admin_id: selectedExam.created_by,
      });

      toast.success("Exam rejected. Teacher has been notified.");
      setIsRejectOpen(false);
      setIsPreviewOpen(false);
      setRejectionReason("");
      setSelectedExam(null);
      loadExams();
    } catch (error) {
      toast.error("Failed to reject exam");
    } finally {
      setIsLoading(false);
    }
  };

  const unpublishExam = async (exam: ExamItem) => {
    if (!confirm(`Are you sure you want to unpublish "${exam.title}"? Students will no longer be able to take this exam.`)) return;
    
    try {
      const { error } = await supabase
        .from("exams")
        .update({ status: "unpublished" as any, exam_token: null })
        .eq("id", exam.id);

      if (error) throw error;

      await supabase.from("admin_notifications").insert({
        title: "Exam Unpublished",
        message: `"${exam.title}" has been unpublished and is no longer available to students.`,
        type: "info",
        target_admin_id: exam.created_by,
      });

      toast.success(`"${exam.title}" has been unpublished.`);
      loadExams();
    } catch (error) {
      toast.error("Failed to unpublish exam");
    }
  };

  const republishExam = async (exam: ExamItem) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from("exams")
        .update({
          status: "active" as any,
          approved_by: user.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", exam.id);

      if (error) throw error;

      toast.success(`"${exam.title}" has been republished.`);
      loadExams();
    } catch (error) {
      toast.error("Failed to republish exam");
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-amber-500/20 text-amber-700 border-amber-300';
      case 'active': return 'bg-green-500/20 text-green-700 border-green-300';
      case 'rejected': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'unpublished': return 'bg-gray-500/20 text-gray-600 border-gray-300';
      case 'draft': return 'bg-blue-500/20 text-blue-700 border-blue-300';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pending';
      case 'active': return 'Published';
      case 'unpublished': return 'Unpublished';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && exam.status === 'pending_approval') ||
      exam.status === filter;
    const matchesSearch = !searchTerm || 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = exams.filter(e => e.status === 'pending_approval').length;
  const activeCount = exams.filter(e => e.status === 'active').length;
  const unpublishedCount = exams.filter(e => e.status === 'unpublished').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Manage Examinations</h1>
              <p className="text-white/80 text-xs sm:text-sm">Approve, decline, or unpublish exams</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white text-sm sm:text-lg px-3 sm:px-4 py-1">
            {pendingCount} Pending
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Published</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Unpublished</p><p className="text-2xl font-bold text-gray-500">{unpublishedCount}</p></CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search exams..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Filter */}
        <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All ({exams.length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm">Published ({activeCount})</TabsTrigger>
            <TabsTrigger value="unpublished" className="text-xs sm:text-sm">Unpublished ({unpublishedCount})</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Exam Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map(exam => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{exam.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">By {exam.teacher_name}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(exam.status)} flex-shrink-0 text-xs`}>
                    {getStatusLabel(exam.status)}
                  </Badge>
                </div>
                {/* Token display for active exams */}
                {exam.status === 'active' && exam.exam_token && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <code className="text-xs sm:text-sm font-mono font-bold text-primary flex-1 truncate">{exam.exam_token}</code>
                    <Button size="sm" variant="ghost" className="h-7 px-2 flex-shrink-0" onClick={() => copyToken(exam.exam_token!)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Type:</span><Badge variant="outline" className="text-xs">{exam.exam_type.toUpperCase()}</Badge></div>
                  <div className="flex justify-between"><span>Duration:</span><span>{exam.duration_minutes} min</span></div>
                  <div className="flex justify-between"><span>Questions:</span><span>{exam.question_count}</span></div>
                  {exam.marks_per_question && <div className="flex justify-between"><span>Marks/Q:</span><span>{exam.marks_per_question}</span></div>}
                  {exam.total_marks && <div className="flex justify-between"><span>Total:</span><span>{exam.total_marks}</span></div>}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => previewExam(exam)}>
                    <Eye className="w-3 h-3 mr-1" /> Preview
                  </Button>
                  {exam.status === 'pending_approval' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => previewExam(exam)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    </>
                  )}
                  {exam.status === 'active' && (
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => unpublishExam(exam)}>
                      <EyeOff className="w-3 h-3 mr-1" /> Unpublish
                    </Button>
                  )}
                  {exam.status === 'unpublished' && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => republishExam(exam)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Republish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredExams.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No exams found
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.title}</DialogTitle>
            <DialogDescription>
              By {selectedExam?.teacher_name} • {selectedExam?.question_count} questions • {selectedExam?.exam_type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedExam?.status === 'pending_approval' && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="editDuration" className="whitespace-nowrap font-medium">
                <Edit className="w-4 h-4 inline mr-1" />
                Duration (min):
              </Label>
              <Input id="editDuration" type="number" value={editDuration} onChange={e => setEditDuration(parseInt(e.target.value) || 60)} className="w-32" min="1" />
              <span className="text-sm text-muted-foreground">Original: {selectedExam.duration_minutes} min</span>
            </div>
          )}

          <div className="space-y-3 mt-4">
            <h3 className="font-semibold">Questions</h3>
            {questions.map((q, i) => {
              const displayText = q.question_text.replace(/^\[(ESSAY|TF|FILL|MULTI|MATCH|NUM|SHORT|FILE)\]\s*/, '');
              const isEssay = q.question_text.startsWith('[ESSAY]');
              const isTF = q.question_text.startsWith('[TF]');

              return (
                <div key={q.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Q{i + 1}.</span>
                    <span className="text-sm">{displayText}</span>
                  </div>
                  {!isEssay && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(isTF ? ['a', 'b'] : ['a', 'b', 'c', 'd']).map(opt => (
                        <div key={opt} className={`p-2 rounded ${q.correct_answer === opt ? 'bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-700' : 'bg-muted'}`}>
                          {opt.toUpperCase()}. {q[`option_${opt}` as keyof Question]}
                        </div>
                      ))}
                    </div>
                  )}
                  {isEssay && <p className="text-xs text-muted-foreground">Essay — requires manual grading</p>}
                </div>
              );
            })}
          </div>

          {selectedExam?.status === 'pending_approval' && (
            <DialogFooter className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsRejectOpen(true)} className="text-destructive border-destructive hover:bg-destructive/10">
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button onClick={approveExam} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" /> {isLoading ? "Approving..." : "Approve & Publish"}
              </Button>
            </DialogFooter>
          )}

          {selectedExam?.status === 'active' && (
            <DialogFooter className="mt-4">
              <Button variant="outline" className="text-amber-600 border-amber-300" onClick={() => { unpublishExam(selectedExam); setIsPreviewOpen(false); }}>
                <EyeOff className="w-4 h-4 mr-2" /> Unpublish
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exam</DialogTitle>
            <DialogDescription>Provide a reason for rejecting "{selectedExam?.title}".</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea id="reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain why..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button onClick={rejectExam} disabled={isLoading} className="bg-destructive text-destructive-foreground">
              {isLoading ? "Rejecting..." : "Reject Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageExamination;
