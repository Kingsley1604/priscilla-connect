import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, ClipboardList, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import LoadingScreen from "@/components/LoadingScreen";

interface Homework {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class_level: string;
  due_date: string;
  total_marks: number;
  is_active: boolean;
  created_at: string;
}

const HomeworkAssignment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    class_level: "",
    due_date: "",
    total_marks: 100
  });

  const classes = [
    "Play Group 1", "Play Group 2", "Nursery 1", "Nursery 2",
    "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
    "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  ];

  const subjects = [
    "Mathematics", "English", "Science", "Social Studies",
    "Basic Technology", "Computer Studies", "French",
    "Physical Education", "Creative Arts", "Religious Studies",
    "Agricultural Science", "Home Economics", "Physics", "Chemistry", "Biology"
  ];

  useEffect(() => {
    loadHomework();
  }, [user]);

  const loadHomework = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomework(data || []);
    } catch (error) {
      console.error('Error loading homework:', error);
      toast.error('Failed to load homework');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject || !formData.class_level || !formData.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('homework')
        .insert({
          title: formData.title,
          description: formData.description || null,
          subject: formData.subject,
          class_level: formData.class_level,
          due_date: new Date(formData.due_date).toISOString(),
          total_marks: formData.total_marks,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success("Homework assigned successfully!");
      setFormData({ title: "", description: "", subject: "", class_level: "", due_date: "", total_marks: 100 });
      setShowForm(false);
      loadHomework();
    } catch (error: any) {
      console.error('Error creating homework:', error);
      toast.error(error.message || "Failed to assign homework");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this homework?")) return;

    try {
      const { error } = await supabase
        .from('homework')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success("Homework deleted");
      loadHomework();
    } catch (error) {
      toast.error("Failed to delete homework");
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Assign Homework</h1>
                <p className="text-white/80">Create and manage homework for students</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-white/20 hover:bg-white/30">
            <Plus className="h-4 w-4 mr-2" />
            New Homework
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {showForm && (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Create Homework Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Chapter 5 Exercises"
                    />
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <Select value={formData.subject} onValueChange={(v) => setFormData(prev => ({ ...prev, subject: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Class *</Label>
                    <Select value={formData.class_level} onValueChange={(v) => setFormData(prev => ({ ...prev, class_level: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Input type="datetime-local" value={formData.due_date} onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Total Marks</Label>
                    <Input type="number" value={formData.total_marks} onChange={(e) => setFormData(prev => ({ ...prev, total_marks: parseInt(e.target.value) || 100 }))} />
                  </div>
                </div>
                <div>
                  <Label>Description/Instructions</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Enter homework instructions..." rows={4} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Assign Homework'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Your Homework Assignments ({homework.filter(h => h.is_active).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {homework.filter(h => h.is_active).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No homework assigned yet. Click "New Homework" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {homework.filter(h => h.is_active).map((hw) => (
                    <TableRow key={hw.id}>
                      <TableCell className="font-medium">{hw.title}</TableCell>
                      <TableCell>{hw.subject}</TableCell>
                      <TableCell><Badge variant="outline">{hw.class_level}</Badge></TableCell>
                      <TableCell>{format(new Date(hw.due_date), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>{hw.total_marks}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(hw.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

export default HomeworkAssignment;
