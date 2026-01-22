import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, BookOpen, Calendar, Plus, Search, UserMinus, UserPlus, AlertTriangle, Check, X, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ClassInfo {
  id: string;
  name: string;
  class_level: string;
  section: string | null;
  academic_session: string;
  class_teacher_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  admission_no: string;
  class_grade: string;
  is_suspended: boolean;
}

interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
}

interface SuspensionRequest {
  id: string;
  student_id: string;
  reason: string;
  status: string;
  created_at: string;
  student_name?: string;
}

const ClassManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("classes");
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [suspensionRequests, setSuspensionRequests] = useState<SuspensionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [existingStudentSearch, setExistingStudentSearch] = useState("");
  const [selectedExistingStudent, setSelectedExistingStudent] = useState<Student | null>(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [teacherAssignedClass, setTeacherAssignedClass] = useState<string | null>(null);
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const [newClass, setNewClass] = useState({
    name: "",
    class_level: "",
    section: "",
    academic_session: "2024/2025"
  });

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    admission_no: "",
    class_grade: "",
    gender: "",
    date_of_birth: "",
    parent_guardian_name: "",
    parent_phone: ""
  });

  const classLevels = [
    "Play Group 1", "Play Group 2", "Nursery 1", "Nursery 2",
    "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
    "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  ];

  useEffect(() => {
    loadData();
    checkIsClassTeacher();
  }, [user]);

  const checkIsClassTeacher = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('teacher_assignments')
        .select('is_class_teacher, class_level')
        .eq('teacher_id', user.id)
        .eq('is_class_teacher', true)
        .eq('is_active', true)
        .single();
      
      setIsClassTeacher(!!data);
      if (data) {
        setTeacherAssignedClass(data.class_level);
        // Auto-set the new student class to teacher's assigned class
        setNewStudent(prev => ({ ...prev, class_grade: data.class_level }));
      }
    } catch {
      setIsClassTeacher(false);
    }
  };

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true)
        .order('class_level', { ascending: true });

      if (classesError) {
        console.error('Error loading classes:', classesError);
      } else {
        setClasses(classesData || []);
      }

      // Task B: Load ALL students from profiles (even without email confirmation)
      // Get student role users first
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      const studentUserIds = (studentRoles || []).map(r => r.user_id);

      // Load student profiles - include all students with role, not just those with admission_no
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, admission_no, class_grade, is_suspended')
        .in('id', studentUserIds)
        .order('name', { ascending: true });

      if (studentsError) {
        console.error('Error loading students:', studentsError);
      } else {
        setStudents((studentsData || []).map(s => ({
          id: s.id,
          name: s.name || 'Unknown',
          admission_no: s.admission_no || 'Pending',
          class_grade: s.class_grade || '',
          is_suspended: s.is_suspended || false
        })));
      }

      // Load class_students
      const { data: classStudentsData } = await supabase
        .from('class_students')
        .select('*')
        .eq('is_active', true);
      
      setClassStudents(classStudentsData || []);

      // Load suspension requests for teachers
      if (user.role === 'teacher') {
        const { data: requestsData, error: requestsError } = await supabase
          .from('suspension_requests')
          .select('*')
          .eq('requested_by', user.id)
          .order('created_at', { ascending: false });

        if (!requestsError && requestsData) {
          setSuspensionRequests(requestsData);
        }
      }

      // Load all suspension requests for admins
      if (user.role === 'admin') {
        const { data: requestsData, error: requestsError } = await supabase
          .from('suspension_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!requestsError && requestsData) {
          setSuspensionRequests(requestsData);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.class_level) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          name: newClass.name,
          class_level: newClass.class_level,
          section: newClass.section || null,
          academic_session: newClass.academic_session,
          created_by: user?.id,
          class_teacher_id: user?.id
        });

      if (error) throw error;

      toast.success("Class created successfully!");
      setIsCreateClassOpen(false);
      setNewClass({ name: "", class_level: "", section: "", academic_session: "2024/2025" });
      loadData();
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.message || "Failed to create class");
    }
  };

  const handleCreateStudent = async () => {
    // Task A: Required fields - name, email, class, admission_no, DOB, gender
    if (!newStudent.name || !newStudent.email || !newStudent.class_grade) {
      toast.error("Please fill in name, email, and class");
      return;
    }

    if (!newStudent.admission_no.trim()) {
      toast.error("Please enter the student's admission number");
      return;
    }

    if (!newStudent.date_of_birth) {
      toast.error("Please enter the student's date of birth");
      return;
    }

    if (!newStudent.gender) {
      toast.error("Please select the student's gender");
      return;
    }

    try {
      // Generate a random password
      const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const tempPassword = generatePassword();
      // Task C: Use admission number provided by class teacher (required)
      const admissionNo = newStudent.admission_no.trim();

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudent.email,
        password: tempPassword,
        options: {
          data: {
            name: newStudent.name,
            role: 'student'
          },
          emailRedirectTo: undefined
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile
        await supabase
          .from('profiles')
          .update({
            name: newStudent.name,
            admission_no: admissionNo,
            class_grade: newStudent.class_grade,
            gender: newStudent.gender || null,
            date_of_birth: newStudent.date_of_birth || null,
            parent_guardian_name: newStudent.parent_guardian_name || null,
            parent_phone: newStudent.parent_phone || null,
            default_password: tempPassword,
            must_change_password: true
          })
          .eq('id', authData.user.id);

        // Add to class if selected
        if (selectedClass) {
          await supabase
            .from('class_students')
            .insert({
              class_id: selectedClass.id,
              student_id: authData.user.id,
              enrolled_by: user?.id
            });
        }

        toast.success(`Student created! Admission: ${admissionNo}, Password: ${tempPassword}`);
        setIsCreateStudentOpen(false);
        setNewStudent({
          name: "",
          email: "",
          admission_no: "",
          class_grade: "",
          gender: "",
          date_of_birth: "",
          parent_guardian_name: "",
          parent_phone: ""
        });
        loadData();
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(error.message || "Failed to create student");
    }
  };

  const handleAddExistingStudent = async () => {
    if (!selectedExistingStudent || !selectedClass) {
      toast.error("Please select a student and class");
      return;
    }

    try {
      // Check if already in class
      const existing = classStudents.find(
        cs => cs.class_id === selectedClass.id && cs.student_id === selectedExistingStudent.id
      );

      if (existing) {
        toast.error("Student is already in this class");
        return;
      }

      const { error } = await supabase
        .from('class_students')
        .insert({
          class_id: selectedClass.id,
          student_id: selectedExistingStudent.id,
          enrolled_by: user?.id
        });

      if (error) throw error;

      // Update student's class_grade
      await supabase
        .from('profiles')
        .update({ class_grade: selectedClass.class_level })
        .eq('id', selectedExistingStudent.id);

      toast.success("Student added to class!");
      setIsAddStudentOpen(false);
      setSelectedExistingStudent(null);
      setExistingStudentSearch("");
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to add student");
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string, classId: string) => {
    if (user?.role === 'admin') {
      // Admin can remove directly
      try {
        const { error } = await supabase
          .from('class_students')
          .update({ is_active: false })
          .eq('class_id', classId)
          .eq('student_id', studentId);

        if (error) throw error;
        toast.success("Student removed from class");
        loadData();
      } catch (error: any) {
        toast.error("Failed to remove student");
      }
    } else {
      // Teacher needs approval - create a request
      toast.info("This action requires admin approval. Please contact an administrator.");
    }
  };

  const handleRequestSuspension = async () => {
    if (!selectedStudent || !suspensionReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    try {
      if (user?.role === 'admin') {
        // Admin can suspend directly
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_suspended: true,
            suspended_at: new Date().toISOString(),
            suspended_by: user.id,
            suspension_reason: suspensionReason
          })
          .eq('id', selectedStudent.id);

        if (profileError) throw profileError;
        toast.success("Student suspended successfully!");
      } else {
        // Teacher creates a request
        const { error } = await supabase
          .from('suspension_requests')
          .insert({
            student_id: selectedStudent.id,
            requested_by: user?.id,
            reason: suspensionReason
          });

        if (error) throw error;
        toast.success("Suspension request submitted for admin approval");
      }

      setIsSuspendOpen(false);
      setSelectedStudent(null);
      setSuspensionReason("");
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to process suspension");
    }
  };

  const handleApproveSuspension = async (requestId: string, studentId: string, approve: boolean) => {
    try {
      if (approve) {
        // Update profile to suspended
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_suspended: true,
            suspended_at: new Date().toISOString(),
            suspended_by: user?.id
          })
          .eq('id', studentId);

        if (profileError) throw profileError;
      }

      // Update request status
      const { error } = await supabase
        .from('suspension_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(approve ? "Suspension approved!" : "Suspension rejected!");
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Failed to process request");
    }
  };

  const handleUnsuspend = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null
        })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Student unsuspended successfully!");
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Failed to unsuspend student");
    }
  };

  const getStudentsInClass = (classId: string) => {
    const studentIds = classStudents
      .filter(cs => cs.class_id === classId)
      .map(cs => cs.student_id);
    return students.filter(s => studentIds.includes(s.id));
  };

  // Helper to determine if a class is in a sector
  const getClassSector = (classLevel: string): string => {
    const primaryClasses = ['Play Group 1', 'Play Group 2', 'Nursery 1', 'Nursery 2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
    return primaryClasses.includes(classLevel) ? 'primary' : 'secondary';
  };

  // Task M: For admins, filter by their sector
  const adminSector = user?.role === 'admin' ? (user as any).sector : null;

  // For class teachers, filter to only show their assigned class
  // For admins, filter by their sector
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.class_level.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If teacher, only show their assigned class
    if (user?.role === 'teacher' && teacherAssignedClass) {
      return matchesSearch && cls.class_level === teacherAssignedClass;
    }
    
    // If admin with sector, filter by sector
    if (user?.role === 'admin' && adminSector && adminSector !== 'both') {
      const classSector = getClassSector(cls.class_level);
      return matchesSearch && classSector === adminSector;
    }
    
    return matchesSearch;
  });

  // For class teachers, only show students in their class
  // For admins, filter by their sector
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_no.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (user?.role === 'teacher' && teacherAssignedClass) {
      return matchesSearch && student.class_grade === teacherAssignedClass;
    }
    
    // If admin with sector, filter by sector
    if (user?.role === 'admin' && adminSector && adminSector !== 'both') {
      const studentSector = getClassSector(student.class_grade);
      return matchesSearch && studentSector === adminSector;
    }
    
    return matchesSearch;
  });

  const searchedExistingStudents = students.filter(student =>
    (student.name.toLowerCase().includes(existingStudentSearch.toLowerCase()) ||
    student.admission_no.toLowerCase().includes(existingStudentSearch.toLowerCase())) &&
    !student.is_suspended
  );

  // Check access - only class teachers and admins
  const canAccess = user?.role === 'admin' || isClassTeacher;

  if (!canAccess && user?.role === 'teacher') {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                Only class teachers can access this feature. Please contact an administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">Class Management</h1>
              <p className="text-sm text-muted-foreground">Manage classes and students</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {user?.role === 'admin' && (
              <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>Add a new class to the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Class Name</Label>
                      <Input
                        value={newClass.name}
                        onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Primary 1A"
                      />
                    </div>
                    <div>
                      <Label>Class Level</Label>
                      <Select value={newClass.class_level} onValueChange={(v) => setNewClass(prev => ({ ...prev, class_level: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {classLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Section (Optional)</Label>
                      <Input
                        value={newClass.section}
                        onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
                        placeholder="e.g., A, B, C"
                      />
                    </div>
                    <div>
                      <Label>Academic Session</Label>
                      <Input
                        value={newClass.academic_session}
                        onChange={(e) => setNewClass(prev => ({ ...prev, academic_session: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateClass}>Create Class</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isCreateStudentOpen} onOpenChange={setIsCreateStudentOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {/* Task O: Renamed button */}
                  Create Student Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Student</DialogTitle>
                  <DialogDescription>Add a new student to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={newStudent.name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Student's full name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Admission Number *</Label>
                      <Input
                        value={newStudent.admission_no}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, admission_no: e.target.value }))}
                        placeholder="e.g., ADM001 (required)"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="student@email.com"
                      />
                    </div>
                    <div>
                      <Label>Class *</Label>
                      {/* If teacher is class teacher, class is fixed to their assigned class */}
                      {user?.role === 'teacher' && teacherAssignedClass ? (
                        <Input
                          value={teacherAssignedClass}
                          disabled
                          className="bg-muted"
                        />
                      ) : (
                        <Select value={newStudent.class_grade} onValueChange={(v) => setNewStudent(prev => ({ ...prev, class_grade: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classLevels.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label>Gender *</Label>
                      <Select value={newStudent.gender} onValueChange={(v) => setNewStudent(prev => ({ ...prev, gender: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={newStudent.date_of_birth}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Parent/Guardian Name</Label>
                      <Input
                        value={newStudent.parent_guardian_name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, parent_guardian_name: e.target.value }))}
                        placeholder="Parent name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Parent Phone</Label>
                      <Input
                        value={newStudent.parent_phone}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, parent_phone: e.target.value }))}
                        placeholder="+234..."
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateStudentOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateStudent}>Create Student</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-lg flex items-center">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-3xl font-bold text-primary mb-1">{classes.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-lg flex items-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-secondary" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-3xl font-bold text-secondary mb-1">{students.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total students</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-lg flex items-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-500" />
                Suspended
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-3xl font-bold text-orange-500 mb-1">
                {students.filter(s => s.is_suspended).length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Suspended accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-lg flex items-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-accent" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-3xl font-bold text-accent mb-1">
                {suspensionRequests.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Suspension requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search classes or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            {isClassTeacher && (
              <TabsTrigger value="assign">
                Assign Students
                {students.filter(s => !s.class_grade || s.class_grade === '').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {students.filter(s => !s.class_grade || s.class_grade === '').length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {(user?.role === 'admin' || suspensionRequests.length > 0) && (
              <TabsTrigger value="suspensions">
                Suspensions
                {suspensionRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {suspensionRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Active</Badge>
                      <Badge variant="outline">{cls.class_level}</Badge>
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{cls.name}</CardTitle>
                    <CardDescription>{cls.section ? `Section ${cls.section}` : cls.class_level}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Session</span>
                        <span className="font-medium text-sm">{cls.academic_session}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Students</span>
                        <span className="font-medium text-sm">{getStudentsInClass(cls.id).length}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedClass(cls);
                          setIsAddStudentOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Student
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredClasses.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No classes found. {user?.role === 'admin' && 'Create one to get started.'}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Admission No.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.admission_no}</TableCell>
                          <TableCell>{student.class_grade || 'Not assigned'}</TableCell>
                          <TableCell>
                            <Badge variant={student.is_suspended ? 'destructive' : 'default'}>
                              {student.is_suspended ? 'Suspended' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {student.is_suspended ? (
                              (user?.role === 'admin') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnsuspend(student.id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Unsuspend
                                </Button>
                              )
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsSuspendOpen(true);
                                }}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                {user?.role === 'admin' ? 'Suspend' : 'Request Suspension'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assign Students Tab - For Class Teachers */}
          {isClassTeacher && (
            <TabsContent value="assign">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle>Assign Unassigned Students to Your Class</CardTitle>
                      <CardDescription>
                        Select students without a class assignment and add them to {teacherAssignedClass}
                      </CardDescription>
                    </div>
                    {selectedStudentsToAssign.size > 0 && (
                      <Button 
                        onClick={async () => {
                          if (!teacherAssignedClass) return;
                          setIsAssigning(true);
                          try {
                            // Find the class for the teacher's assigned class
                            const targetClass = classes.find(c => c.class_level === teacherAssignedClass);
                            
                            for (const studentId of selectedStudentsToAssign) {
                              // Update student's class_grade
                              await supabase
                                .from('profiles')
                                .update({ class_grade: teacherAssignedClass })
                                .eq('id', studentId);
                              
                              // Add to class_students if class exists
                              if (targetClass) {
                                await supabase
                                  .from('class_students')
                                  .insert({
                                    class_id: targetClass.id,
                                    student_id: studentId,
                                    enrolled_by: user?.id
                                  });
                              }
                            }
                            
                            toast.success(`${selectedStudentsToAssign.size} student(s) assigned to ${teacherAssignedClass}`);
                            setSelectedStudentsToAssign(new Set());
                            loadData();
                          } catch (error: any) {
                            console.error('Error assigning students:', error);
                            toast.error('Failed to assign students');
                          } finally {
                            setIsAssigning(false);
                          }
                        }}
                        disabled={isAssigning}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign {selectedStudentsToAssign.size} Selected to {teacherAssignedClass}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const unassignedStudents = students.filter(s => 
                      (!s.class_grade || s.class_grade === '') && !s.is_suspended
                    );
                    
                    if (unassignedStudents.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No unassigned students found</p>
                          <p className="text-sm">All students have been assigned to a class</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedStudentsToAssign.size === unassignedStudents.length) {
                                setSelectedStudentsToAssign(new Set());
                              } else {
                                setSelectedStudentsToAssign(new Set(unassignedStudents.map(s => s.id)));
                              }
                            }}
                          >
                            {selectedStudentsToAssign.size === unassignedStudents.length ? 'Deselect All' : 'Select All'}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            {unassignedStudents.length} unassigned student(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {unassignedStudents.map(student => (
                            <div
                              key={student.id}
                              onClick={() => {
                                const newSet = new Set(selectedStudentsToAssign);
                                if (newSet.has(student.id)) {
                                  newSet.delete(student.id);
                                } else {
                                  newSet.add(student.id);
                                }
                                setSelectedStudentsToAssign(newSet);
                              }}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedStudentsToAssign.has(student.id) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded border ${
                                  selectedStudentsToAssign.has(student.id) 
                                    ? 'bg-primary border-primary' 
                                    : 'border-muted-foreground'
                                } flex items-center justify-center`}>
                                  {selectedStudentsToAssign.has(student.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {student.admission_no || 'No Admission #'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Suspensions Tab */}
          <TabsContent value="suspensions">
            <Card>
              <CardHeader>
                <CardTitle>Suspension Requests</CardTitle>
                <CardDescription>
                  {user?.role === 'admin' 
                    ? 'Review and approve/reject suspension requests from teachers'
                    : 'Your submitted suspension requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suspensionRequests.map((request) => {
                    const studentInfo = students.find(s => s.id === request.student_id);
                    return (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-medium">{studentInfo?.name || 'Unknown Student'}</p>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested on {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' ? (
                              user?.role === 'admin' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveSuspension(request.id, request.student_id, true)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApproveSuspension(request.id, request.student_id, false)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary">Pending</Badge>
                              )
                            ) : (
                              <Badge variant={request.status === 'approved' ? 'default' : 'destructive'}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {suspensionRequests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No suspension requests
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Existing Student to Class Dialog */}
        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to {selectedClass?.name}</DialogTitle>
              <DialogDescription>
                Search for an existing student to add to this class
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Search Student</Label>
                <Input
                  value={existingStudentSearch}
                  onChange={(e) => setExistingStudentSearch(e.target.value)}
                  placeholder="Search by name or admission number..."
                />
              </div>
              {existingStudentSearch && (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {searchedExistingStudents.map(student => (
                    <div
                      key={student.id}
                      className={`p-3 cursor-pointer hover:bg-muted flex justify-between items-center ${
                        selectedExistingStudent?.id === student.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedExistingStudent(student)}
                    >
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.admission_no}</p>
                      </div>
                      {selectedExistingStudent?.id === student.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                  {searchedExistingStudents.length === 0 && (
                    <p className="p-3 text-center text-muted-foreground">No students found</p>
                  )}
                </div>
              )}
              {selectedExistingStudent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">Selected: <strong>{selectedExistingStudent.name}</strong></p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddStudentOpen(false);
                setSelectedExistingStudent(null);
                setExistingStudentSearch("");
              }}>Cancel</Button>
              <Button onClick={handleAddExistingStudent} disabled={!selectedExistingStudent}>
                Add to Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Student Dialog */}
        <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {user?.role === 'admin' ? 'Suspend Student' : 'Request Student Suspension'}
              </DialogTitle>
              <DialogDescription>
                {user?.role === 'admin' 
                  ? `Suspend ${selectedStudent?.name}'s account`
                  : `Submit a suspension request for ${selectedStudent?.name}. An admin must approve it.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <Input value={selectedStudent?.name || ''} disabled />
              </div>
              <div>
                <Label>Reason for Suspension</Label>
                <Textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Provide a detailed reason for the suspension..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRequestSuspension}>
                {user?.role === 'admin' ? 'Suspend Student' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClassManagement;
