import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, UserCheck, Search, Users, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LoadingScreen from "@/components/LoadingScreen";
import { Checkbox } from "@/components/ui/checkbox";

interface Assignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  class_level: string;
  subject: string;
  academic_session: string;
  assigned_at: string;
  is_active: boolean;
  is_class_teacher: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

const TeacherAssignment = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [openTeacherSelect, setOpenTeacherSelect] = useState(false);
  
  const [formData, setFormData] = useState({
    class_level: "",
    subject: "",
    academic_session: "2024/2025",
    is_class_teacher: false
  });

  const classes = [
    "Play Group 1", "Play Group 2",
    "Nursery 1", "Nursery 2",
    "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
    "JSS 1", "JSS 2", "JSS 3",
    "SSS 1", "SSS 2", "SSS 3"
  ];

  const subjects = [
    "Mathematics", "English", "Science", "Social Studies",
    "Basic Technology", "Computer Studies", "French",
    "Physical Education", "Creative Arts", "Religious Studies",
    "Agricultural Science", "Home Economics"
  ];

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchTeachers(searchTerm);
    }
  }, [searchTerm]);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase.rpc('search_teachers', { 
        search_term: '' 
      });
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const searchTeachers = async (term: string) => {
    try {
      const { data, error } = await supabase.rpc('search_teachers', { 
        search_term: term 
      });
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error searching teachers:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load teacher assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher || !formData.class_level) {
      toast.error("Please select a teacher and class");
      return;
    }

    // Subject is optional for class teachers
    if (!formData.is_class_teacher && !formData.subject) {
      toast.error("Please select a subject for subject teacher assignment");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If assigning as class teacher, update the class table
      if (formData.is_class_teacher) {
        const { data: classData } = await supabase
          .from('classes')
          .select('id')
          .eq('class_level', formData.class_level)
          .eq('is_active', true)
          .single();
        
        if (classData) {
          await supabase
            .from('classes')
            .update({ class_teacher_id: selectedTeacher.id })
            .eq('id', classData.id);
        }
      }

      const { error } = await supabase
        .from('teacher_assignments')
        .insert({
          teacher_id: selectedTeacher.id,
          teacher_name: selectedTeacher.name,
          class_level: formData.class_level,
          subject: formData.is_class_teacher ? "Class Teacher" : formData.subject,
          academic_session: formData.academic_session,
          assigned_by: user.id,
          is_class_teacher: formData.is_class_teacher
        });

      if (error) throw error;

      toast.success(formData.is_class_teacher 
        ? "Class teacher assigned successfully!" 
        : "Subject teacher assigned successfully!");
      setSelectedTeacher(null);
      setFormData({
        class_level: "",
        subject: "",
        academic_session: "2024/2025",
        is_class_teacher: false
      });
      setShowForm(false);
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('This teacher is already assigned to this class and subject');
      } else {
        toast.error('Failed to assign teacher');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this assignment?")) return;

    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success("Assignment removed successfully");
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Teacher Assignments</h1>
                  <p className="text-white/80">Assign teachers to classes and subjects</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/admin/teacher-creation')} className="bg-white/20 hover:bg-white/30 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Teacher
              </Button>
              <Button variant="secondary" onClick={() => navigate('/admin/teacher-management')} className="bg-white/20 hover:bg-white/30 text-white">
                <Users className="h-4 w-4 mr-2" />
                Manage Teachers
              </Button>
              <Button onClick={() => {
                if (teachers.length === 0) {
                  toast.error("Please create a teacher first before making assignments");
                  navigate('/admin/teacher-creation');
                  return;
                }
                setShowForm(!showForm);
              }} className="gap-2 bg-white text-primary hover:bg-white/90">
                <Plus className="h-4 w-4" />
                New Assignment
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-6">

        {showForm && (
          <Card className="mb-6 shadow-medium">
            <CardHeader>
              <CardTitle>Create Teacher Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Select Teacher</Label>
                    <Popover open={openTeacherSelect} onOpenChange={setOpenTeacherSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTeacherSelect}
                          className="w-full justify-between"
                        >
                          {selectedTeacher ? selectedTeacher.name : "Search and select teacher..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Search teachers..." 
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                          />
                          <CommandEmpty>No teacher found.</CommandEmpty>
                          <CommandGroup>
                            {teachers && teachers.length > 0 ? (
                              teachers.map((teacher) => (
                                <CommandItem
                                  key={teacher.id}
                                  value={teacher.id}
                                  onSelect={() => {
                                    setSelectedTeacher(teacher);
                                    setOpenTeacherSelect(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{teacher.name || 'Unknown'}</span>
                                    <span className="text-sm text-muted-foreground">{teacher.email || ''}</span>
                                  </div>
                                </CommandItem>
                              ))
                            ) : null}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedTeacher && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedTeacher.name} ({selectedTeacher.email})
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Class Level</Label>
                    <Select
                      value={formData.class_level}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, class_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                   </div>
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Checkbox 
                      id="is_class_teacher"
                      checked={formData.is_class_teacher}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        is_class_teacher: checked === true,
                        subject: checked === true ? "" : prev.subject
                      }))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="is_class_teacher" className="flex items-center gap-2 cursor-pointer">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        Assign as Class Teacher
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Class teachers can manage students, attendance, and class affairs
                      </p>
                    </div>
                  </div>
                  {!formData.is_class_teacher && (
                    <div>
                      <Label>Subject</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subj => (
                            <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Academic Session</Label>
                    <Input
                      value={formData.academic_session}
                      onChange={(e) => setFormData(prev => ({ ...prev, academic_session: e.target.value }))}
                      placeholder="e.g., 2024/2025"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Assigning...' : 'Assign Teacher'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teacher assignments yet. Click "New Assignment" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Role/Subject</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Assigned On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {assignment.teacher_name}
                            {assignment.is_class_teacher && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.class_level}</Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.is_class_teacher ? (
                            <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-300">
                              Class Teacher
                            </Badge>
                          ) : (
                            assignment.subject
                          )}
                        </TableCell>
                        <TableCell>{assignment.academic_session}</TableCell>
                        <TableCell>{format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

export default TeacherAssignment;