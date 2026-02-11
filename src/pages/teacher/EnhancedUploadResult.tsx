import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminSector } from "@/hooks/useAdminSector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const EnhancedUploadResult = () => {
  const navigate = useNavigate();
  const { adminSector, isSuperAdmin } = useAdminSector();
  const { user } = useAuth();
  
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  
  const [formData, setFormData] = useState({
    academicSession: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    totalTimeOpened: "",
    resultType: "",
    term: "",
    classLevel: "",
    grade: ""
  });

  // Fetch teacher's assigned class from teacher_assignments
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!user?.id) return;
      
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_level, is_class_teacher')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .eq('is_class_teacher', true);
      
      if (assignments && assignments.length > 0) {
        setIsClassTeacher(true);
        const classes = [...new Set(assignments.map(a => a.class_level))];
        setAssignedClasses(classes);
      }
    };
    fetchAssignment();
  }, [user?.id]);

  // Determine sector from assigned class
  const getClassSector = (className: string) => {
    const primaryClasses = ['Play Group 1', 'Play Group 2', 'Nursery One', 'Nursery Two', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
      'First Grade', 'Second Grade', 'Third Grade', 'Fourth Grade', 'Fifth Grade', 'Sixth Grade'];
    if (primaryClasses.some(c => className.toLowerCase().includes(c.toLowerCase()))) return 'Primary';
    if (className.toLowerCase().includes('jss') || className.toLowerCase().includes('junior')) return 'Junior Secondary';
    if (className.toLowerCase().includes('ss') || className.toLowerCase().includes('senior')) return 'Senior Secondary';
    return 'Primary';
  };

  // If teacher is a class teacher, restrict to assigned classes only
  const getClassLevelOptions = () => {
    if (isSuperAdmin) {
      return [
        { value: "Primary", label: "Primary" },
        { value: "Junior Secondary", label: "Junior Secondary" },
        { value: "Senior Secondary", label: "Senior Secondary" }
      ];
    }
    
    if (isClassTeacher && assignedClasses.length > 0) {
      const sectors = new Set(assignedClasses.map(getClassSector));
      return Array.from(sectors).map(s => ({ value: s, label: s }));
    }
    
    if (adminSector === 'primary') {
      return [{ value: "Primary", label: "Primary" }];
    }
    if (adminSector === 'secondary') {
      return [
        { value: "Junior Secondary", label: "Junior Secondary" },
        { value: "Senior Secondary", label: "Senior Secondary" }
      ];
    }
    return [
      { value: "Primary", label: "Primary" },
      { value: "Junior Secondary", label: "Junior Secondary" },
      { value: "Senior Secondary", label: "Senior Secondary" }
    ];
  };

  const getGradeOptions = () => {
    const { classLevel } = formData;
    
    // If class teacher, only show their assigned class
    if (isClassTeacher && assignedClasses.length > 0 && !isSuperAdmin) {
      return assignedClasses.filter(c => getClassSector(c) === classLevel);
    }
    
    if (classLevel === "Primary") {
      return [
        "Play Group 1", "Play Group 2", 
        "Nursery One", "Nursery Two", 
        "First Grade", "Second Grade", "Third Grade", 
        "Fourth Grade", "Fifth Grade", "Sixth Grade"
      ];
    } else if (classLevel === "Junior Secondary") {
      return ["Seventh Grade", "Eighth Grade", "Ninth Grade"];
    } else if (classLevel === "Senior Secondary") {
      return ["Tenth Grade", "Eleventh Grade", "Twelfth Grade"];
    }
    return [];
  };

  const classLevelOptions = getClassLevelOptions();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Task A: Fixed heading */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link to="/reports">
            <Button variant="outline" size="sm" className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Upload Result</h1>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Result Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Academic Session</Label>
                <Input 
                  value={formData.academicSession} 
                  onChange={(e) => setFormData({...formData, academicSession: e.target.value})}
                  placeholder="e.g., 2024/2025"
                />
              </div>
              <div>
                <Label className="text-sm">Total Time School Opened</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 180 days"
                  value={formData.totalTimeOpened}
                  onChange={(e) => setFormData({...formData, totalTimeOpened: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm">Result Type</Label>
                <Select value={formData.resultType} onValueChange={(v) => setFormData({...formData, resultType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MidTerm Result">MidTerm Result</SelectItem>
                    <SelectItem value="Examination Result">Examination Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Term</Label>
                <Select value={formData.term} onValueChange={(v) => setFormData({...formData, term: v})}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Class Level</Label>
                <Select 
                  value={formData.classLevel} 
                  onValueChange={(v) => setFormData({...formData, classLevel: v, grade: ""})}
                >
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {classLevelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Grade</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(v) => setFormData({...formData, grade: v})} 
                  disabled={!formData.classLevel}
                >
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {getGradeOptions().map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.grade && (
          <div className="flex justify-end gap-4">
            <Button onClick={() => {
              if (!formData.academicSession || !formData.totalTimeOpened || !formData.resultType || !formData.term || !formData.classLevel || !formData.grade) {
                toast.error("Please fill in all required fields");
                return;
              }
              
              const params = `session=${formData.academicSession}&term=${formData.term}&class=${formData.classLevel}&grade=${formData.grade}&totalOpened=${formData.totalTimeOpened}`;
              
              // Nursery Midterm Reports
              if (formData.resultType === "MidTerm Result" && formData.classLevel === "Primary" && (formData.grade === "Nursery One" || formData.grade === "Nursery Two")) {
                navigate(`/teacher/nursery-midterm-report?${params}`);
              }
              // Other Primary Midterm Results
              else if (formData.resultType === "MidTerm Result" && formData.classLevel === "Primary") {
                navigate(`/teacher/midterm-report?${params}`);
              }
              // Nursery One Examination Result
              else if (formData.resultType === "Examination Result" && formData.classLevel === "Primary" && formData.grade === "Nursery One") {
                navigate(`/teacher/nursery-one-exam?${params}`);
              }
              // Nursery Two Examination Result
              else if (formData.resultType === "Examination Result" && formData.classLevel === "Primary" && formData.grade === "Nursery Two") {
                navigate(`/teacher/nursery-two-exam?${params}`);
              }
              // Secondary School Examination Results - Navigate to SecondaryResultUpload
              else if (formData.resultType === "Examination Result" && (formData.classLevel === "Junior Secondary" || formData.classLevel === "Senior Secondary")) {
                navigate(`/teacher/secondary-result-upload?${params}`);
              }
              // Secondary School Midterm Results - Under development
              else if (formData.resultType === "MidTerm Result" && (formData.classLevel === "Junior Secondary" || formData.classLevel === "Senior Secondary")) {
                toast.info("Secondary Midterm Result System is under development");
                return;
              }
              // Default to regular report card
              else {
                navigate(`/teacher/report-card?${params}`);
              }
            }}>
              <Send className="h-4 w-4 mr-2" />
              Create Result
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedUploadResult;