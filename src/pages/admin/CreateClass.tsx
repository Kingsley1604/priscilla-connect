import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, School, Plus, Users, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminSector } from "@/hooks/useAdminSector";

interface ClassInfo {
  id: string;
  name: string;
  class_level: string;
  section: string | null;
  academic_session: string;
  class_teacher_id: string | null;
  is_active: boolean;
  created_at: string;
  teacher_name?: string;
}

const ALL_CLASS_LEVELS = [
  "Nursery 1", "Nursery 2",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SSS 1", "SSS 2", "SSS 3"
];

const sections = ["A", "B", "C", "D"];

const CreateClass = () => {
  const { filterClassLevels, canManageClassLevel, adminSector } = useAdminSector();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter class levels based on admin's sector
  const classLevels = filterClassLevels(ALL_CLASS_LEVELS);
  
  // Form state
  const [className, setClassName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [section, setSection] = useState("");
  const [academicSession, setAcademicSession] = useState("2024/2025");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch teacher names for classes with class teachers
      const classesWithTeachers = await Promise.all(
        (data || []).map(async (cls) => {
          if (cls.class_teacher_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", cls.class_teacher_id)
              .single();
            return { ...cls, teacher_name: profileData?.name || "Unknown" };
          }
          return cls;
        })
      );

      // Filter classes based on admin's sector
      const filteredClasses = classesWithTeachers.filter(cls => 
        canManageClassLevel(cls.class_level)
      );

      setClasses(filteredClasses);
    } catch (error: any) {
      console.error("Error loading classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!className.trim() || !classLevel) {
      toast.error("Please fill in class name and level");
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase
        .from("classes")
        .insert({
          name: className.trim(),
          class_level: classLevel,
          section: section && section !== "none" ? section : null,
          academic_session: academicSession,
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;

      toast.success("Class created successfully!");
      setDialogOpen(false);
      setClassName("");
      setClassLevel("");
      setSection("");
      loadClasses();
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error(error.message || "Failed to create class");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      toast.success("Class deleted successfully");
      loadClasses();
    } catch (error: any) {
      console.error("Error deleting class:", error);
      toast.error(error.message || "Failed to delete class");
    }
  };

  const toggleClassStatus = async (classId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ is_active: !isActive })
        .eq("id", classId);

      if (error) throw error;

      toast.success(`Class ${isActive ? "deactivated" : "activated"} successfully`);
      loadClasses();
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <School className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create Class</h1>
                <p className="text-white/90">Create and manage school classes</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 hover:bg-white/30 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Add a new class to the school system. You can assign a teacher later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      placeholder="e.g., Primary 1A, JSS 2 Gold"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classLevel">Class Level</Label>
                    <Select value={classLevel} onValueChange={setClassLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class level" />
                      </SelectTrigger>
                      <SelectContent>
                        {classLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section (Optional)</Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {sections.map((sec) => (
                          <SelectItem key={sec} value={sec}>
                            {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicSession">Academic Session</Label>
                    <Select value={academicSession} onValueChange={setAcademicSession}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Class"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Total Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{classes.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Active Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {classes.filter(c => c.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  With Class Teacher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {classes.filter(c => c.class_teacher_id).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes Table */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>All Classes</CardTitle>
              <CardDescription>
                Manage all classes in the school. Assign class teachers through Teacher Assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes created yet. Click "Create New Class" to add one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.class_level}</TableCell>
                        <TableCell>{cls.section || "-"}</TableCell>
                        <TableCell>{cls.academic_session}</TableCell>
                        <TableCell>
                          {cls.teacher_name || (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cls.is_active ? "default" : "secondary"}>
                            {cls.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleClassStatus(cls.id, cls.is_active)}
                            >
                              {cls.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClass(cls.id)}
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

          {/* Info Card */}
          <Card className="shadow-soft mt-6">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>After creating classes, go to <strong>Teacher Assignments</strong> to assign class teachers</li>
                <li>Only teachers assigned as class teachers will have access to Class Management</li>
                <li>Class teachers can add/remove students from their assigned classes</li>
                <li>Only assigned class teachers can create and upload results for their class</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default CreateClass;
