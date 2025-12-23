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
import { ArrowLeft, Users, BookOpen, Calendar, Plus, Search, UserMinus, UserPlus, AlertTriangle, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

interface SuspensionRequest {
  id: string;
  student_id: string;
  reason: string;
  status: string;
  created_at: string;
  student_name?: string;
}

const ClassManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("classes");
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [suspensionRequests, setSuspensionRequests] = useState<SuspensionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");

  const [newClass, setNewClass] = useState({
    name: "",
    class_level: "",
    section: "",
    academic_session: "2024/2025"
  });

  const classLevels = [
    "Play Group 1", "Play Group 2", "Nursery 1", "Nursery 2",
    "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
    "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"
  ];

  useEffect(() => {
    loadData();
  }, [user]);

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

      // Load students from profiles
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, admission_no, class_grade, is_suspended')
        .not('admission_no', 'is', null)
        .order('name', { ascending: true });

      if (studentsError) {
        console.error('Error loading students:', studentsError);
      } else {
        setStudents((studentsData || []).map(s => ({
          id: s.id,
          name: s.name || 'Unknown',
          admission_no: s.admission_no || '',
          class_grade: s.class_grade || '',
          is_suspended: s.is_suspended || false
        })));
      }

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

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.class_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <TabsList className="mb-4">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
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
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button variant="default" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Students
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
                  {suspensionRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Student ID: {request.student_id}</p>
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
                  ))}

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