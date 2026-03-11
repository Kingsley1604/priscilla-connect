import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Printer, Plus, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Subject {
  name: string;
  cas1: number;
  cas2: number;
  total: number;
  grade: string;
  remark: string;
}

const MidtermReportSheet = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [schoolStamp, setSchoolStamp] = useState<string | null>(null);
  
  const [reportData, setReportData] = useState({
    studentName: "",
    admissionNo: "",
    dateOfBirth: "",
    classLevel: "",
    academicYear: "",
    term: "",
    sex: "",
    totalSchoolOpened: "",
    timesPresent: "",
    timesAbsent: "",
    schoolSports: "",
    otherActivities: "",
    conductPercentage: 95,
    conductRating: "Satisfactory",
    clubOrganization: "",
    classTeacherComments: "",
    headTeacherComments: "",
    classTeacherName: "",
    headTeacherName: "",
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { name: "Mathematics", cas1: null as any, cas2: null as any, total: 0, grade: "", remark: "" },
    { name: "English Language", cas1: null as any, cas2: null as any, total: 0, grade: "", remark: "" },
    { name: "Basic Science", cas1: null as any, cas2: null as any, total: 0, grade: "", remark: "" },
  ]);

  const calculateGrade = (total: number): { grade: string; remark: string } => {
    if (total >= 27) return { grade: "A", remark: "Excellent" };
    if (total >= 24) return { grade: "B", remark: "Very Good" };
    if (total >= 21) return { grade: "C", remark: "Good" };
    if (total >= 18) return { grade: "D", remark: "Fair" };
    if (total >= 15) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  };

  const updateSubjectScore = (index: number, field: 'cas1' | 'cas2', value: string) => {
    const newSubjects = [...subjects];
    const parsedValue = value === "" ? null : Math.min(parseInt(value) || 0, 15);
    newSubjects[index][field] = parsedValue as any;
    const cas1 = newSubjects[index].cas1 ?? 0;
    const cas2 = newSubjects[index].cas2 ?? 0;
    newSubjects[index].total = cas1 + cas2;
    const hasAny = newSubjects[index].cas1 !== null || newSubjects[index].cas2 !== null;
    if (hasAny) {
      const gradeInfo = calculateGrade(newSubjects[index].total);
      newSubjects[index].grade = gradeInfo.grade;
      newSubjects[index].remark = gradeInfo.remark;
    } else {
      newSubjects[index].grade = "";
      newSubjects[index].remark = "";
    }
    setSubjects(newSubjects);
  };

  const displayScore = (score: any): string => {
    if (score === null || score === undefined) return "";
    return String(score);
  };

  const addSubject = () => {
    if (subjects.length < 20) {
      setSubjects([...subjects, { name: "", cas1: 0, cas2: 0, total: 0, grade: "", remark: "" }]);
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const calculateSummary = () => {
    const totalObtainable = subjects.length * 30;
    const totalObtained = subjects.reduce((sum, s) => sum + s.total, 0);
    const percentage = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
    
    let position = "C";
    if (percentage >= 80) position = "A";
    else if (percentage >= 60) position = "B";
    
    return { totalObtainable, totalObtained, percentage: percentage.toFixed(1), position };
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolStamp(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!reportData.studentName || !reportData.admissionNo || !reportData.classLevel) {
      toast.error("Please fill in required student information");
      return;
    }

    if (!reportData.term) {
      toast.error("Please select a term");
      return;
    }

    if (!reportData.academicYear) {
      toast.error("Please enter the academic year");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      // Task G: First check if teacher is a class teacher for the specified class
      const { data: assignmentData } = await supabase
        .from('teacher_assignments')
        .select('class_level')
        .eq('teacher_id', userData.user.id)
        .eq('is_class_teacher', true)
        .eq('is_active', true)
        .maybeSingle();

      if (!assignmentData) {
        toast.error("Only class teachers can submit reports. Please contact your administrator.");
        setIsSubmitting(false);
        return;
      }

      // Find the student by admission number
      const { data: studentData } = await supabase
        .from('profiles')
        .select('id')
        .eq('admission_no', reportData.admissionNo)
        .maybeSingle();

      const studentId = studentData?.id || userData.user.id;

      const summary = calculateSummary();
      
      const { error } = await supabase.from("report_cards").insert({
        student_id: studentId,
        student_name: reportData.studentName,
        admission_no: reportData.admissionNo,
        date_of_birth: reportData.dateOfBirth || null,
        class_level: reportData.classLevel || assignmentData.class_level,
        academic_session: reportData.academicYear,
        term: reportData.term,
        gender: reportData.sex,
        total_school_opened: parseInt(reportData.totalSchoolOpened) || 0,
        times_present: parseInt(reportData.timesPresent) || 0,
        times_absent: parseInt(reportData.timesAbsent) || 0,
        conduct_percentage: reportData.conductPercentage,
        conduct_rating: reportData.conductRating,
        total_obtainable_score: summary.totalObtainable,
        total_score_obtained: summary.totalObtained,
        percentage: parseFloat(summary.percentage),
        position: summary.position,
        club_organization: reportData.clubOrganization,
        class_teacher_comments: reportData.classTeacherComments,
        head_teacher_comments: reportData.headTeacherComments,
        class_teacher_name: reportData.classTeacherName,
        head_teacher_name: reportData.headTeacherName,
        passport_photo_url: passportPhoto,
        school_sports: reportData.schoolSports ? [reportData.schoolSports] : [],
        other_activities: reportData.otherActivities ? [reportData.otherActivities] : [],
        created_by: userData.user.id,
      });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Task G & H & P: Notify admins that a result was submitted
      // Get teacher's profile for name
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userData.user.id)
        .maybeSingle();

      const teacherName = teacherProfile?.name || 'Unknown Teacher';
      const className = reportData.classLevel || assignmentData.class_level || 'Unknown Class';

      // Insert notification for admins
      await supabase.from('result_upload_notifications').insert({
        teacher_id: userData.user.id,
        teacher_name: teacherName,
        class_name: className,
        student_name: reportData.studentName,
        result_type: 'Mid Term Result',
        submitted_at: new Date().toISOString()
      });

      toast.success("Midterm report submitted successfully! Admins have been notified for approval.");
      navigate("/reports");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report. Please check your permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 1cm; }
        }
      `}</style>

      {/* Header - Hide on print */}
      <header className="bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium no-print overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 flex-shrink-0" onClick={() => navigate("/reports")}>
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Reports</span>
              </Button>
              <h1 className="text-lg sm:text-3xl font-bold truncate">Mid-Term Assessment Report</h1>
            </div>
            {/* Desktop buttons */}
            <div className="hidden sm:flex gap-2 flex-shrink-0">
              <Button onClick={handlePrint} variant="secondary">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Upload className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
            {/* Mobile three-dot menu */}
            <div className="sm:hidden flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSubmit} disabled={isSubmitting}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto p-6">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <img 
                src={new URL('@/assets/priscilla-school-logo.png', import.meta.url).href} 
                alt="Priscilla School Logo" 
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain flex-shrink-0"
              />
              <CardTitle className="text-center text-xl sm:text-2xl">PRISCILLA SCHOOL MID-TERM ASSESSMENT REPORT</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Student Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pupil's Name</Label>
                    <Input value={reportData.studentName} onChange={(e) => setReportData({...reportData, studentName: e.target.value})} className="no-print" />
                    <p className="print:block hidden">{reportData.studentName}</p>
                  </div>
                  <div>
                    <Label>Admission Number</Label>
                    <Input value={reportData.admissionNo} onChange={(e) => setReportData({...reportData, admissionNo: e.target.value})} className="no-print" />
                    <p className="print:block hidden">{reportData.admissionNo}</p>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={reportData.dateOfBirth} onChange={(e) => setReportData({...reportData, dateOfBirth: e.target.value})} className="no-print" />
                    <p className="print:block hidden">{reportData.dateOfBirth}</p>
                  </div>
                  <div>
                    <Label>Sex</Label>
                    <Select value={reportData.sex} onValueChange={(value) => setReportData({...reportData, sex: value})}>
                      <SelectTrigger className="no-print"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                    </Select>
                    <p className="print:block hidden">{reportData.sex}</p>
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Input value={reportData.classLevel} onChange={(e) => setReportData({...reportData, classLevel: e.target.value})} className="no-print" />
                    <p className="print:block hidden">{reportData.classLevel}</p>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input value={reportData.academicYear} onChange={(e) => setReportData({...reportData, academicYear: e.target.value})} className="no-print" />
                    <p className="print:block hidden">{reportData.academicYear}</p>
                  </div>
                  <div>
                    <Label>Term</Label>
                    <Select value={reportData.term} onValueChange={(value) => setReportData({...reportData, term: value})}>
                      <SelectTrigger className="no-print"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="First Mid-Term">First Mid-Term</SelectItem><SelectItem value="Second Mid-Term">Second Mid-Term</SelectItem><SelectItem value="Third Mid-Term">Third Mid-Term</SelectItem></SelectContent>
                    </Select>
                    <p className="print:block hidden">{reportData.term}</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Passport Photo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt="Student" className="w-32 h-32 object-cover mx-auto rounded" />
                  ) : (
                    <div className="w-32 h-32 bg-muted mx-auto rounded flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="mt-2 no-print" />
                </div>
              </div>
            </div>

            {/* Attendance & Activities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
              <div>
                <Label>Total Time School Opened</Label>
                <Input type="number" value={reportData.totalSchoolOpened} onChange={(e) => setReportData({...reportData, timesAbsent: String(parseInt(reportData.totalSchoolOpened) - parseInt(e.target.value || "0")), totalSchoolOpened: e.target.value})} className="no-print" />
                <p className="print:block hidden">{reportData.totalSchoolOpened}</p>
              </div>
              <div>
                <Label>No. of Times Present</Label>
                <Input type="number" value={reportData.timesPresent} onChange={(e) => setReportData({...reportData, timesPresent: e.target.value, timesAbsent: String(parseInt(reportData.totalSchoolOpened) - parseInt(e.target.value || "0"))})} className="no-print" />
                <p className="print:block hidden">{reportData.timesPresent}</p>
              </div>
              <div>
                <Label>No. of Times Absent</Label>
                <Input type="number" value={reportData.timesAbsent} readOnly className="bg-muted" />
                <p className="print:block hidden">{reportData.timesAbsent}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
              <div>
                <Label>School Sports</Label>
                <Input value={reportData.schoolSports} onChange={(e) => setReportData({...reportData, schoolSports: e.target.value})} placeholder="e.g., Football, Basketball" className="no-print" />
                <p className="print:block hidden">{reportData.schoolSports}</p>
              </div>
              <div>
                <Label>Other Activities</Label>
                <Input value={reportData.otherActivities} onChange={(e) => setReportData({...reportData, otherActivities: e.target.value})} placeholder="e.g., Children's Day, Quiz" className="no-print" />
                <p className="print:block hidden">{reportData.otherActivities}</p>
              </div>
            </div>

            {/* Conduct Section */}
            <div className="border-b pb-4">
              <Label>Conduct</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1">
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${reportData.conductPercentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${reportData.conductPercentage}%` }}
                    />
                  </div>
                </div>
                <span className="font-bold">{reportData.conductPercentage}%</span>
              </div>
              <div className="mt-2">
                <Select value={reportData.conductRating} onValueChange={(value) => setReportData({...reportData, conductRating: value})}>
                  <SelectTrigger className="no-print"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Very Good">Very Good</SelectItem>
                    <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="print:block hidden mt-2">{reportData.conductRating}</p>
            </div>

            {/* Half-Term Assessment Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-lg">Half-Term Assessment Report</Label>
                <Button onClick={addSubject} size="sm" className="no-print" disabled={subjects.length >= 20}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subject
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2">Subject</th>
                      <th className="border p-2">CAS 1 (15)</th>
                      <th className="border p-2">CAS 2 (15)</th>
                      <th className="border p-2">Total (30)</th>
                      <th className="border p-2">Grade</th>
                      <th className="border p-2">Teacher's Remark</th>
                      <th className="border p-2 no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="border p-2">
                          <Input value={subject.name} onChange={(e) => {
                            const newSubjects = [...subjects];
                            newSubjects[index].name = e.target.value;
                            setSubjects(newSubjects);
                          }} className="no-print" />
                          <span className="print:block hidden">{subject.name}</span>
                        </td>
                        <td className="border p-2">
                          <Input type="number" min="0" max="15" value={subject.cas1} onChange={(e) => updateSubjectScore(index, 'cas1', parseInt(e.target.value) || 0)} className="no-print" />
                          <span className="print:block hidden">{subject.cas1}</span>
                        </td>
                        <td className="border p-2">
                          <Input type="number" min="0" max="15" value={subject.cas2} onChange={(e) => updateSubjectScore(index, 'cas2', parseInt(e.target.value) || 0)} className="no-print" />
                          <span className="print:block hidden">{subject.cas2}</span>
                        </td>
                        <td className="border p-2 font-bold">{subject.total}</td>
                        <td className="border p-2 font-bold">{subject.grade}</td>
                        <td className="border p-2">{subject.remark}</td>
                        <td className="border p-2 no-print">
                          <Button variant="ghost" size="sm" onClick={() => removeSubject(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted p-4 rounded">
              <div>
                <Label className="text-sm">Total Obtainable</Label>
                <p className="text-2xl font-bold">{summary.totalObtainable}</p>
              </div>
              <div>
                <Label className="text-sm">Total Obtained</Label>
                <p className="text-2xl font-bold">{summary.totalObtained}</p>
              </div>
              <div>
                <Label className="text-sm">Percentage</Label>
                <p className="text-2xl font-bold">{summary.percentage}%</p>
              </div>
              <div>
                <Label className="text-sm">Position</Label>
                <p className="text-2xl font-bold">{summary.position}</p>
              </div>
            </div>

            {/* Club/Organization */}
            <div>
              <Label>Club/Organization</Label>
              <Input value={reportData.clubOrganization} onChange={(e) => setReportData({...reportData, clubOrganization: e.target.value})} placeholder="e.g., Ballet and Science Club" className="no-print" />
              <p className="print:block hidden">{reportData.clubOrganization}</p>
            </div>

            {/* Comments Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Class Teacher's Comments</Label>
                <Textarea value={reportData.classTeacherComments} onChange={(e) => setReportData({...reportData, classTeacherComments: e.target.value})} rows={4} className="no-print" />
                <p className="print:block hidden whitespace-pre-wrap">{reportData.classTeacherComments}</p>
              </div>
              <div>
                <Label>Head Teacher's Comments</Label>
                <Textarea value={reportData.headTeacherComments} onChange={(e) => setReportData({...reportData, headTeacherComments: e.target.value})} rows={4} className="no-print" />
                <p className="print:block hidden whitespace-pre-wrap">{reportData.headTeacherComments}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <Label>Class Teacher Name</Label>
                <Input value={reportData.classTeacherName} onChange={(e) => setReportData({...reportData, classTeacherName: e.target.value})} className="no-print" />
                <p className="print:block hidden">{reportData.classTeacherName}</p>
                <div className="mt-2 border-t border-foreground/20 pt-1">
                  <p className="text-xs text-muted-foreground">Signature</p>
                </div>
              </div>
              <div>
                <Label>Head Teacher Name</Label>
                <Input value={reportData.headTeacherName} onChange={(e) => setReportData({...reportData, headTeacherName: e.target.value})} className="no-print" />
                <p className="print:block hidden">{reportData.headTeacherName}</p>
                <div className="mt-2 border-t border-foreground/20 pt-1">
                  <p className="text-xs text-muted-foreground">Signature</p>
                </div>
              </div>
              <div>
                <Label>School Stamp</Label>
                {schoolStamp ? (
                  <img src={schoolStamp} alt="School Stamp" className="w-24 h-24 object-contain" />
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleStampUpload} className="mt-2 no-print" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MidtermReportSheet;
