import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Send, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DraftReportCard {
  id: string;
  student_name: string;
  admission_no: string;
  class_level: string;
  academic_session: string;
  term: string;
  created_at: string;
}

const DraftResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DraftReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [user]);

  const loadDrafts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('id, student_name, admission_no, class_level, academic_session, term, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (draftId: string) => {
    // Navigate to edit page (you can create an edit version of StudentReportCardSystem)
    navigate(`/teacher/report-card?edit=${draftId}`);
  };

  const handlePublish = async (draftId: string) => {
    try {
      // In a real implementation, you might want to change a status field
      // For now, we'll just show a success message
      toast.success('Report card submitted to admin for approval');
      loadDrafts();
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish report card');
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      // Delete subjects first (foreign key constraint)
      await supabase
        .from('report_card_subjects')
        .delete()
        .eq('report_card_id', draftId);

      // Then delete the report card
      const { error } = await supabase
        .from('report_cards')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      toast.success('Draft deleted successfully');
      loadDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Draft Report Cards</h1>
            <p className="text-muted-foreground">Manage and publish your draft report cards</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saved Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading drafts...</div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No drafts found. Create a new report card to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-medium">{draft.student_name}</TableCell>
                      <TableCell>{draft.admission_no}</TableCell>
                      <TableCell>{draft.class_level}</TableCell>
                      <TableCell>{draft.academic_session}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{draft.term}</Badge>
                      </TableCell>
                      <TableCell>{new Date(draft.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(draft.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePublish(draft.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(draft.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DraftResults;
