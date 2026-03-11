import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Printer, Save } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Subject {
  name: string;
  halfTerm: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

const NurseryOneExamResult = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [formData, setFormData] = useState({
    studentName: "",
    admissionNo: "",
    gender: "",
    dateOfBirth: "",
    class: searchParams.get("grade") || "Nursery One",
    session: searchParams.get("session") || "",
    term: searchParams.get("term") || "",
    totalSchoolOpened: searchParams.get("totalOpened") || "",
    timesPresent: "",
    timesAbsent: "",
    schoolAttendance: "",
    sportsAttendance: "",
    sportFiesta: "No",
    artExhibition: "No",
    eggHunt: "No",
    conductRating: 95,
    conductText: "Exemplary",
    position: "",
    clubOrganization: "",
    classTeacherComment: "",
    headTeacherComment: "",
    classTeacherName: "",
    headTeacherName: "",
    nextTermBegins: "",
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { name: "Numeracy", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Literacy", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Poems/Rhymes", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Social Habits", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Hygiene", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Health Habits", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Colouring", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Craft", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Practical Life", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
    { name: "Sensorial", halfTerm: null as any, exam: null as any, total: 0, grade: "", remark: "" },
  ]);

  const [images, setImages] = useState({
    passportPhoto: null as string | null,
    coatOfArms: null as string | null,
    classTeacherSignature: null as string | null,
    headTeacherSignature: null as string | null,
    schoolStamp: null as string | null,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const absent = parseInt(formData.totalSchoolOpened) - parseInt(formData.timesPresent || "0");
    if (!isNaN(absent) && absent >= 0) {
      setFormData(prev => ({ ...prev, timesAbsent: absent.toString() }));
    }
  }, [formData.totalSchoolOpened, formData.timesPresent]);

  const calculateGrade = (total: number): { grade: string; remark: string } => {
    if (total >= 75) return { grade: "A", remark: "Excellent" };
    if (total >= 65) return { grade: "B", remark: "Very Good" };
    if (total >= 55) return { grade: "C", remark: "Good" };
    if (total >= 45) return { grade: "D", remark: "Fair" };
    if (total >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  };

  const updateSubject = (index: number, field: keyof Subject, value: string | number) => {
    const updated = [...subjects];
    if (field === "halfTerm" || field === "exam") {
      const parsedValue = value === "" || value === null ? null : Number(value);
      updated[index] = { ...updated[index], [field]: parsedValue };
      const halfTerm = updated[index].halfTerm ?? 0;
      const exam = updated[index].exam ?? 0;
      const total = halfTerm + exam;
      const hasAny = updated[index].halfTerm !== null || updated[index].exam !== null;
      if (hasAny) {
        const { grade, remark } = calculateGrade(total);
        updated[index].total = total;
        updated[index].grade = grade;
        updated[index].remark = remark;
      } else {
        updated[index].total = 0;
        updated[index].grade = "";
        updated[index].remark = "";
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSubjects(updated);
  };

  const displayScore = (score: any): string => {
    if (score === null || score === undefined) return "";
    return String(score);
  };

  const calculateSummary = () => {
    const totalObtainable = subjects.length * 100;
    const totalObtained = subjects.reduce((sum, s) => sum + s.total, 0);
    const average = subjects.length > 0 ? (totalObtained / subjects.length).toFixed(2) : "0.00";
    const percentage = ((totalObtained / totalObtainable) * 100).toFixed(2);
    return { totalObtainable, totalObtained, average, percentage };
  };

  const handleImageUpload = (field: keyof typeof images, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    if (!formData.studentName || !formData.admissionNo) {
      toast.error("Please fill in student name and admission number");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const summary = calculateSummary();
      
      // Insert report card
      const { data: reportCard, error: reportError } = await supabase
        .from("report_cards")
        .insert({
          student_name: formData.studentName,
          admission_no: formData.admissionNo,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          class_level: formData.class,
          academic_session: formData.session,
          term: formData.term,
          total_school_opened: parseInt(formData.totalSchoolOpened),
          times_present: parseInt(formData.timesPresent),
          times_absent: parseInt(formData.timesAbsent),
          conduct_percentage: formData.conductRating,
          conduct_rating: formData.conductText,
          total_obtainable_score: summary.totalObtainable,
          total_score_obtained: summary.totalObtained,
          average_score: parseFloat(summary.average),
          percentage: parseFloat(summary.percentage),
          position: formData.position,
          club_organization: formData.clubOrganization,
          class_teacher_comments: formData.classTeacherComment,
          head_teacher_comments: formData.headTeacherComment,
          class_teacher_name: formData.classTeacherName,
          head_teacher_name: formData.headTeacherName,
          next_term_begins: formData.nextTermBegins,
          passport_photo_url: images.passportPhoto,
          created_by: user.id,
          student_id: user.id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert subjects
      const subjectInserts = subjects.map(subject => ({
        report_card_id: reportCard.id,
        subject_name: subject.name,
        half_term_score: subject.halfTerm,
        exam_score: subject.exam,
        total_score: subject.total,
        grade: subject.grade,
        teacher_remark: subject.remark,
      }));

      const { error: subjectsError } = await supabase
        .from("report_card_subjects")
        .insert(subjectInserts);

      if (subjectsError) throw subjectsError;

      toast.success("Nursery One result saved successfully!");
    } catch (error: any) {
      console.error("Error saving result:", error);
      toast.error(error.message || "Failed to save result");
    } finally {
      setIsSaving(false);
    }
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 print:hidden">
          <Link to="/teacher/upload-result">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Nursery One - Examination Result</h1>
          <div className="ml-auto flex gap-2">
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Result"}
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-8 space-y-6">
            {/* Header Section */}
            <div className="text-center border-b pb-6">
              {/* Nigeria Coat of Arms - Top Center */}
              <div className="flex justify-center mb-3">
                <img 
                  src={new URL('@/assets/ng-coat-of-arms.jpg', import.meta.url).href} 
                  alt="Nigeria Coat of Arms" 
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                />
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-20 h-20 border rounded flex items-center justify-center bg-muted print:hidden">
                  <span className="text-xs text-muted-foreground">Coat of Arms</span>
                </div>
                
                <div className="flex-1 mx-4">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full py-3 px-6 mb-2">
                    <h1 className="text-2xl font-bold text-primary">PRISCILLA SCHOOL</h1>
                  </div>
                  <p className="text-sm">📍 59 Oscar Ibru Way, (Formerly Marine Road) G.R.A. Apapa, Lagos</p>
                  <p className="text-sm">📧 info@priscillaschool.com | 📞 +234 803 302 1210</p>
                </div>

                <div className="w-20 h-20 border rounded flex items-center justify-center bg-muted">
                  {images.passportPhoto ? (
                    <img src={images.passportPhoto} alt="Student" className="w-full h-full object-cover rounded" />
                  ) : (
                    <Label htmlFor="passport" className="text-xs cursor-pointer print:hidden">Upload Photo</Label>
                  )}
                  <input id="passport" type="file" className="hidden" onChange={(e) => handleImageUpload("passportPhoto", e)} accept="image/*" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-primary">NURSERY ONE - TERMLY ASSESSMENT REPORT</h2>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label>Pupil's Name</Label>
                <Input value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} className="print:border-0 print:p-0" />
              </div>
              <div>
                <Label>Admission No.</Label>
                <Input value={formData.admissionNo} onChange={(e) => setFormData({...formData, admissionNo: e.target.value})} className="print:border-0 print:p-0" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                  <SelectTrigger className="print:border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="print:border-0 print:p-0" />
              </div>
              <div>
                <Label>Class</Label>
                <Input value={formData.class} readOnly className="print:border-0 print:p-0" />
              </div>
              <div>
                <Label>Session</Label>
                <Input value={formData.session} readOnly className="print:border-0 print:p-0" />
              </div>
              <div>
                <Label>Term</Label>
                <Input value={formData.term} readOnly className="print:border-0 print:p-0" />
              </div>
            </div>

            {/* Attendance */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold mb-3">Attendance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <Label>Total School Opened</Label>
                  <Input type="number" value={formData.totalSchoolOpened} onChange={(e) => setFormData({...formData, totalSchoolOpened: e.target.value})} className="print:border-0" />
                </div>
                <div>
                  <Label>Times Present</Label>
                  <Input type="number" value={formData.timesPresent} onChange={(e) => setFormData({...formData, timesPresent: e.target.value})} className="print:border-0" />
                </div>
                <div>
                  <Label>Times Absent</Label>
                  <Input type="number" value={formData.timesAbsent} readOnly className="print:border-0 bg-muted" />
                </div>
                <div>
                  <Label>Other Activities</Label>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span>Sport Fiesta:</span>
                      <Select value={formData.sportFiesta} onValueChange={(v) => setFormData({...formData, sportFiesta: v})}>
                        <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Art Exhibition:</span>
                      <Select value={formData.artExhibition} onValueChange={(v) => setFormData({...formData, artExhibition: v})}>
                        <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conduct */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-bold mb-3">Conduct</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`h-full flex items-center justify-center text-white text-sm font-bold ${formData.conductRating >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${formData.conductRating}%` }}
                    >
                      {formData.conductRating}%
                    </div>
                  </div>
                </div>
                <Input type="number" min="0" max="100" value={formData.conductRating} onChange={(e) => setFormData({...formData, conductRating: parseInt(e.target.value)})} className="w-20" />
                <Input value={formData.conductText} onChange={(e) => setFormData({...formData, conductText: e.target.value})} className="w-32" placeholder="Rating" />
              </div>
            </div>

            {/* Assessment Table */}
            <div>
              <h3 className="font-bold mb-3 text-center text-lg">TERMLY ASSESSMENT REPORT</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="border p-2 text-sm">Subjects</th>
                      <th className="border p-2 text-sm">Half Term (40)</th>
                      <th className="border p-2 text-sm">Exam (60)</th>
                      <th className="border p-2 text-sm">Total (100)</th>
                      <th className="border p-2 text-sm">Grade</th>
                      <th className="border p-2 text-sm">Teacher's Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="border p-2 text-sm font-medium">{subject.name}</td>
                        <td className="border p-1">
                          <Input type="number" min="0" max="40" value={subject.halfTerm || ""} onChange={(e) => updateSubject(index, "halfTerm", e.target.value)} className="text-center h-8 print:border-0" />
                        </td>
                        <td className="border p-1">
                          <Input type="number" min="0" max="60" value={subject.exam || ""} onChange={(e) => updateSubject(index, "exam", e.target.value)} className="text-center h-8 print:border-0" />
                        </td>
                        <td className="border p-2 text-center font-bold">{subject.total}</td>
                        <td className="border p-2 text-center font-bold text-primary">{subject.grade}</td>
                        <td className="border p-2 text-sm text-center">{subject.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-yellow-50 p-4 rounded-lg">
              <div className="text-center">
                <Label className="text-xs">Total Obtainable</Label>
                <div className="text-xl font-bold text-primary">{summary.totalObtainable}</div>
              </div>
              <div className="text-center">
                <Label className="text-xs">Total Obtained</Label>
                <div className="text-xl font-bold text-primary">{summary.totalObtained}</div>
              </div>
              <div className="text-center">
                <Label className="text-xs">Average</Label>
                <div className="text-xl font-bold text-primary">{summary.average}</div>
              </div>
              <div className="text-center">
                <Label className="text-xs">Percentage</Label>
                <div className="text-xl font-bold text-primary">{summary.percentage}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Position</Label>
                <Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="e.g., 1st, 2nd, 3rd" />
              </div>
              <div>
                <Label>Club/Organization</Label>
                <Input value={formData.clubOrganization} onChange={(e) => setFormData({...formData, clubOrganization: e.target.value})} placeholder="e.g., Ballet and Science Club" />
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <div>
                <Label>Class Teacher's Comment</Label>
                <Textarea value={formData.classTeacherComment} onChange={(e) => setFormData({...formData, classTeacherComment: e.target.value})} rows={2} className="print:border-0" />
              </div>
              <div>
                <Label>Head Teacher's Comment</Label>
                <Textarea value={formData.headTeacherComment} onChange={(e) => setFormData({...formData, headTeacherComment: e.target.value})} rows={2} className="print:border-0" />
              </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              <div>
                <Label>Class Teacher Name</Label>
                <Input value={formData.classTeacherName} onChange={(e) => setFormData({...formData, classTeacherName: e.target.value})} className="print:border-0" />
                <Label className="text-xs mt-2 print:hidden">Signature:</Label>
                <div className="border rounded h-16 flex items-center justify-center bg-muted mt-1">
                  {images.classTeacherSignature ? (
                    <img src={images.classTeacherSignature} alt="Signature" className="h-full object-contain" />
                  ) : (
                    <Label htmlFor="ctSignature" className="text-xs cursor-pointer print:hidden">Upload</Label>
                  )}
                  <input id="ctSignature" type="file" className="hidden" onChange={(e) => handleImageUpload("classTeacherSignature", e)} accept="image/*" />
                </div>
              </div>
              <div>
                <Label>Head Teacher Name</Label>
                <Input value={formData.headTeacherName} onChange={(e) => setFormData({...formData, headTeacherName: e.target.value})} className="print:border-0" />
                <Label className="text-xs mt-2 print:hidden">Signature:</Label>
                <div className="border rounded h-16 flex items-center justify-center bg-muted mt-1">
                  {images.headTeacherSignature ? (
                    <img src={images.headTeacherSignature} alt="Signature" className="h-full object-contain" />
                  ) : (
                    <Label htmlFor="htSignature" className="text-xs cursor-pointer print:hidden">Upload</Label>
                  )}
                  <input id="htSignature" type="file" className="hidden" onChange={(e) => handleImageUpload("headTeacherSignature", e)} accept="image/*" />
                </div>
              </div>
              <div>
                <Label>School Stamp</Label>
                <div className="border rounded h-24 flex items-center justify-center bg-muted mt-1">
                  {images.schoolStamp ? (
                    <img src={images.schoolStamp} alt="Stamp" className="h-full object-contain" />
                  ) : (
                    <Label htmlFor="stamp" className="text-xs cursor-pointer print:hidden">Upload Stamp</Label>
                  )}
                  <input id="stamp" type="file" className="hidden" onChange={(e) => handleImageUpload("schoolStamp", e)} accept="image/*" />
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Next Term Begins</Label>
                  <Input type="date" value={formData.nextTermBegins} onChange={(e) => setFormData({...formData, nextTermBegins: e.target.value})} className="print:border-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NurseryOneExamResult;