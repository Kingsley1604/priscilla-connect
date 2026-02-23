import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, Edit, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PendingExam {
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

const ExamApproval = () => {
  const navigate = useNavigate();
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([]);
  const [allExams, setAllExams] = useState<PendingExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [editDuration, setEditDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [studentScores, setStudentScores] = useState<any[]>([]);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      // Load pending exams
      const { data: pending, error: pendingError } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "pending_approval")
        .order("submitted_for_approval_at", { ascending: false });

      if (pendingError) throw pendingError;

      // Load all exams for overview
      const { data: all, error: allError } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });

      if (allError) throw allError;

      // Get teacher names and question counts
      const enrichExams = async (exams: any[]) => {
        return Promise.all(
          (exams || []).map(async (exam) => {
            const { count } = await supabase
              .from("exam_questions")
              .select("*", { count: "exact", head: true })
              .eq("exam_id", exam.id);

            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", exam.created_by)
              .single();

            return {
              ...exam,
              question_count: count || 0,
              teacher_name: profile?.name || "Unknown",
            };
          })
        );
      };

      setPendingExams(await enrichExams(pending || []));
      setAllExams(await enrichExams(all || []));
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

  const loadStudentScores = async (examId: string) => {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("*, profiles:student_id(name)")
      .eq("exam_id", examId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error loading scores:", error);
      return;
    }
    setStudentScores(data || []);
  };

  const previewExam = async (exam: PendingExam) => {
    setSelectedExam(exam);
    setEditDuration(exam.duration_minutes);
    await loadQuestions(exam.id);
    setIsPreviewOpen(true);
  };

  const viewScores = async (exam: PendingExam) => {
    setSelectedExam(exam);
    await loadStudentScores(exam.id);
    setShowScores(true);
  };

  const approveExam = async () => {
    if (!selectedExam) return;
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Update duration if changed, then approve (set status to active)
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

      // Create notification for teacher
      await supabase.from("exam_approval_notifications").insert({
        exam_id: selectedExam.id,
        teacher_id: selectedExam.created_by,
        teacher_name: selectedExam.teacher_name || "Teacher",
        exam_title: selectedExam.title,
        exam_type: selectedExam.exam_type,
        action: "approved",
        admin_id: user.user.id,
      });

      // Also notify via admin_notifications for the teacher
      await supabase.from("admin_notifications").insert({
        title: "Exam Approved & Published",
        message: `"${selectedExam.title}" has been approved and published. Tokens have been auto-generated.`,
        type: "exam_approved",
        target_admin_id: selectedExam.created_by,
      });

      toast.success("Exam approved and published! Tokens auto-generated.");
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

      toast.success("Exam rejected. Teacher has been notified.");
      setIsRejectOpen(false);
      setIsPreviewOpen(false);
      setRejectionReason("");
      setSelectedExam(null);
      loadExams();
    } catch (error) {
      console.error("Error rejecting exam:", error);
      toast.error("Failed to reject exam");
    } finally {
      setIsLoading(false);
    }
  };

  const displayExams = filter === 'pending' ? pendingExams : allExams;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-amber-500/20 text-amber-700 border-amber-300';
      case 'active': return 'bg-green-500/20 text-green-700 border-green-300';
      case 'rejected': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'completed': return 'bg-blue-500/20 text-blue-700 border-blue-300';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Exam Approval</h1>
              <p className="text-white/80">Review, approve, or reject teacher-submitted exams</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white text-lg px-4 py-1">
            {pendingExams.length} Pending
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Filter tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({pendingExams.length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            <FileText className="w-4 h-4 mr-2" />
            All Exams ({allExams.length})
          </Button>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">
                      By {exam.teacher_name}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(exam.status)}>
                    {exam.status === 'pending_approval' ? 'Pending' : exam.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{exam.exam_type.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{exam.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>{exam.question_count}</span>
                  </div>
                  {exam.marks_per_question && (
                    <div className="flex justify-between">
                      <span>Marks/Question:</span>
                      <span>{exam.marks_per_question}</span>
                    </div>
                  )}
                  {exam.total_marks && (
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <span>{exam.total_marks}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => previewExam(exam)}>
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  {exam.status === 'active' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => viewScores(exam)}>
                      <Users className="w-3 h-3 mr-1" />
                      Scores
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {displayExams.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {filter === 'pending' ? 'No exams pending approval' : 'No exams found'}
            </div>
          )}
        </div>
      </div>

      {/* Exam Preview/Approval Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedExam?.teacher_name} • {selectedExam?.question_count} questions • {selectedExam?.exam_type.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {/* Admin can edit duration */}
          {selectedExam?.status === 'pending_approval' && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="editDuration" className="whitespace-nowrap font-medium">
                <Edit className="w-4 h-4 inline mr-1" />
                Duration (minutes):
              </Label>
              <Input
                id="editDuration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(parseInt(e.target.value) || 60)}
                className="w-32"
                min="1"
              />
              <span className="text-sm text-muted-foreground">
                Original: {selectedExam.duration_minutes} min
              </span>
            </div>
          )}

          {/* Questions Preview */}
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold">Questions</h3>
            {questions.map((q, i) => {
              const qText = q.question_text;
              const displayText = qText.replace(/^\[(ESSAY|TF|FILL|MULTI|MATCH|NUM|SHORT|FILE)\]\s*/, '');
              const isEssay = qText.startsWith('[ESSAY]');
              const isTF = qText.startsWith('[TF]');

              return (
                <div key={q.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Q{i + 1}.</span>
                    <span className="text-sm">{displayText}</span>
                  </div>
                  {!isEssay && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(isTF ? ['a', 'b'] : ['a', 'b', 'c', 'd']).map((opt) => (
                        <div
                          key={opt}
                          className={`p-2 rounded ${q.correct_answer === opt ? 'bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-700' : 'bg-muted'}`}
                        >
                          {opt.toUpperCase()}. {q[`option_${opt}` as keyof Question]}
                        </div>
                      ))}
                    </div>
                  )}
                  {isEssay && (
                    <p className="text-xs text-muted-foreground">Essay — requires manual grading</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons for pending exams */}
          {selectedExam?.status === 'pending_approval' && (
            <DialogFooter className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectOpen(true);
                }}
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={approveExam} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                {isLoading ? "Approving..." : "Approve & Publish"}
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
            <DialogDescription>
              Provide a reason for rejecting "{selectedExam?.title}". The teacher will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this exam is being rejected and what needs to be changed..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
            <Button
              onClick={rejectExam}
              disabled={isLoading || !rejectionReason.trim()}
              variant="destructive"
            >
              {isLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Scores Dialog */}
      <Dialog open={showScores} onOpenChange={setShowScores}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Scores — {selectedExam?.title}</DialogTitle>
            <DialogDescription>
              {studentScores.length} students have completed this exam
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {studentScores.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No completed attempts yet</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Student</th>
                      <th className="text-center p-3">Score</th>
                      <th className="text-center p-3">Total</th>
                      <th className="text-center p-3">%</th>
                      <th className="text-right p-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentScores.map((attempt) => (
                      <tr key={attempt.id} className="border-t">
                        <td className="p-3">{(attempt.profiles as any)?.name || 'Unknown'}</td>
                        <td className="text-center p-3 font-medium">{attempt.score ?? '—'}</td>
                        <td className="text-center p-3">{attempt.total_questions}</td>
                        <td className="text-center p-3">
                          {attempt.score != null ? `${Math.round((attempt.score / attempt.total_questions) * 100)}%` : '—'}
                        </td>
                        <td className="text-right p-3 text-muted-foreground">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamApproval;
