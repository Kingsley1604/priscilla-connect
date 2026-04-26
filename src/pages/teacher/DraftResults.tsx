import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, AlertCircle, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSector } from "@/hooks/useAdminSector";

interface DraftReportCard {
  id: string;
  student_name: string;
  admission_no: string;
  class_level: string;
  academic_session: string;
  term: string;
  created_at: string;
  source: 'primary' | 'secondary';
  status: string;
  rejection_reason?: string;
}

const DraftResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canManageClassLevel, isSuperAdmin, userRole } = useAdminSector();
  const [drafts, setDrafts] = useState<DraftReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherAssignedClass, setTeacherAssignedClass] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTeacherAssignment();
      loadDrafts();
    }

    const channel = supabase
      .channel('draft-results-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_cards' }, loadDrafts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secondary_report_cards' }, loadDrafts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTeacherAssignment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('teacher_assignments')
      .select('class_level')
      .eq('teacher_id', user.id)
      .eq('is_class_teacher', true)
      .eq('is_active', true)
      .maybeSingle();
    if (data) setTeacherAssignedClass(data.class_level);
  };

  const loadDrafts = async () => {
    if (!user) return;
    
    try {
      // Load primary drafts AND rejected primary reports - only those created by this teacher.
      // Rejected reports must reappear in Drafts so the teacher can revise + resubmit.
      const { data: primaryData, error: primaryError } = await supabase
        .from('report_cards')
        .select('id, student_name, admission_no, class_level, academic_session, term, created_at, status, rejection_reason' as any)
        .eq('created_by', user.id)
        .in('status', ['draft', 'rejected', 'pending'])
        .order('created_at', { ascending: false });

      if (primaryError) throw primaryError;

      // Load secondary drafts/rejected - only those created by this teacher
      const { data: secondaryData, error: secondaryError } = await supabase
        .from('secondary_report_cards')
        .select('id, student_name, admission_no, class_level, academic_session, term, created_at, status, rejection_reason')
        .eq('created_by', user.id)
        .in('status', ['draft', 'rejected'])
        .order('created_at', { ascending: false });

      if (secondaryError) throw secondaryError;

      let allDrafts: DraftReportCard[] = [
        ...((primaryData || []) as any[]).map((d: any) => ({
          id: d.id,
          student_name: d.student_name,
          admission_no: d.admission_no,
          class_level: d.class_level,
          academic_session: d.academic_session,
          term: d.term,
          created_at: d.created_at,
          source: 'primary' as const,
          status: d.status || 'draft',
          rejection_reason: d.rejection_reason || undefined,
        })),
        ...(secondaryData || []).map(d => ({ ...d, source: 'secondary' as const, status: d.status || 'draft' }))
      ];

      // Apply role-based filtering
      if (!isSuperAdmin && userRole !== 'admin') {
        // For class teachers, filter to only their assigned class
        if (teacherAssignedClass) {
          allDrafts = allDrafts.filter(d => {
            // Only show drafts for the teacher's assigned class
            const draftClassLower = d.class_level?.toLowerCase() || '';
            const assignedClassLower = teacherAssignedClass.toLowerCase();
            return draftClassLower.includes(assignedClassLower) || assignedClassLower.includes(draftClassLower);
          });
        }
        // Additionally filter by sector
        allDrafts = allDrafts.filter(d => canManageClassLevel(d.class_level));
      }

      allDrafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  // Re-load when assignment is fetched
  useEffect(() => {
    if (teacherAssignedClass !== null) loadDrafts();
  }, [teacherAssignedClass]);

  const handleEdit = (draft: DraftReportCard) => {
    if (draft.source === 'secondary') {
      navigate(`/teacher/secondary-result-upload?edit=${draft.id}`);
    } else if (draft.class_level?.toLowerCase().includes('nursery')) {
      navigate(`/teacher/nursery-midterm-report?edit=${draft.id}`);
    } else {
      navigate(`/teacher/report-card?edit=${draft.id}`);
    }
  };

  const handleDelete = async (draft: DraftReportCard) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      if (draft.source === 'primary') {
        await supabase.from('report_card_subjects').delete().eq('report_card_id', draft.id);
        const { error } = await supabase.from('report_cards').delete().eq('id', draft.id);
        if (error) throw error;
      } else {
        await supabase.from('secondary_report_subjects').delete().eq('report_card_id', draft.id);
        await supabase.from('secondary_affective_traits').delete().eq('report_card_id', draft.id);
        await supabase.from('secondary_psychomotor_skills').delete().eq('report_card_id', draft.id);
        const { error } = await supabase.from('secondary_report_cards').delete().eq('id', draft.id);
        if (error) throw error;
      }
      toast.success('Draft deleted successfully');
      loadDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Drafts</h1>
            <p className="text-muted-foreground text-sm">Manage saved and rejected report cards</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Draft & Rejected Results</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading drafts...</div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No draft results available.</p>
                <p className="text-sm">Saved drafts and admin-rejected results will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map((draft) => (
                      <TableRow key={`${draft.source}-${draft.id}`}>
                        <TableCell className="font-medium">{draft.student_name}</TableCell>
                        <TableCell>{draft.admission_no}</TableCell>
                        <TableCell><Badge variant="outline">{draft.class_level}</Badge></TableCell>
                        <TableCell>{draft.term}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={draft.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {draft.status === 'rejected' ? 'Rejected' : 'Draft'}
                            </Badge>
                            {draft.status === 'rejected' && draft.rejection_reason && (
                              <div className="flex items-start gap-1 text-xs text-destructive max-w-[200px]">
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{draft.rejection_reason}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(draft.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(draft)}>
                              <Edit className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(draft)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DraftResults;
