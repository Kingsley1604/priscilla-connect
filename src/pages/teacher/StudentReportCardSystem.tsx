import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Printer, Save, Plus, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subject {
  id: string;
  subject_name: string;
  half_term_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  teacher_remark: string;
}

interface ReportCardData {
  student_name: string;
  admission_no: string;
  date_of_birth: string;
  gender: string;
  class_level: string;
  academic_session: string;
  term: string;
  passport_photo_url: string;
  
  total_school_opened: number;
  times_present: number;
  times_absent: number;
  
  school_sports: string[];
  other_activities: string[];
  
  conduct_rating: string;
  conduct_percentage: number;
  
  subjects: Subject[];
  
  club_organization: string;
  class_teacher_comments: string;
  head_teacher_comments: string;
  class_teacher_name: string;
  head_teacher_name: string;
  next_term_begins: string;
}

const StudentReportCardSystem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const initialData = location.state?.formData;

  const [reportCard, setReportCard] = useState<ReportCardData>({
    student_name: "",
    admission_no: "",
    date_of_birth: "",
    gender: "Male",
    class_level: initialData?.classLevel || "",
    academic_session: initialData?.academicSession || "",
    term: initialData?.term || "",
    passport_photo_url: "",
    total_school_opened: 116,
    times_present: 0,
    times_absent: 0,
    school_sports: ["Aerobics"],
    other_activities: ["Sport Fiesta", "Art Exhibition"],
    conduct_rating: "Good",
    conduct_percentage: 95,
    subjects: [],
    club_organization: "Football and Reading Club",
    class_teacher_comments: "",
    head_teacher_comments: "",
    class_teacher_name: "",
    head_teacher_name: "",
    next_term_begins: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [classTeacherSignature, setClassTeacherSignature] = useState<string>("");
  const [headTeacherSignature, setHeadTeacherSignature] = useState<string>("");
  const [sportInput, setSportInput] = useState("");
  const [activityInput, setActivityInput] = useState("");

  const defaultSubjects = [
    "Mathematics", "English Studies", "Social Studies", "Basic Science",
    "Agricultural Science", "ICT/Computer Science", "Verbal Reasoning",
    "Quantitative Reasoning", "Vocational Studies", "Cultural and Creative Art",
    "Music", "Civic Education", "French Language", "Christian Religious Studies",
    "Yoruba Language", "Handwriting", "Phonics"
  ];

  useEffect(() => {
    // Initialize with default subjects
    if (reportCard.subjects.length === 0) {
      const initialSubjects = defaultSubjects.map((name, index) => ({
        id: `subj-${index}`,
        subject_name: name,
        half_term_score: 0,
        exam_score: 0,
        total_score: 0,
        grade: "",
        teacher_remark: ""
      }));
      setReportCard(prev => ({ ...prev, subjects: initialSubjects }));
    }
  }, []);

  // Auto-calculate absent times
  useEffect(() => {
    const absent = reportCard.total_school_opened - reportCard.times_present;
    setReportCard(prev => ({ ...prev, times_absent: Math.max(0, absent) }));
  }, [reportCard.total_school_opened, reportCard.times_present]);

  const calculateGrade = (total: number): { grade: string; remark: string } => {
    if (total >= 90) return { grade: "A", remark: "EXCELLENT" };
    if (total >= 80) return { grade: "B", remark: "VERY GOOD" };
    if (total >= 70) return { grade: "C", remark: "GOOD" };
    if (total >= 60) return { grade: "D", remark: "AVERAGE" };
    if (total >= 50) return { grade: "E", remark: "PASS" };
    return { grade: "F", remark: "FAIL" };
  };

  const updateSubjectScore = (id: string, field: 'half_term_score' | 'exam_score', value: number) => {
    setReportCard(prev => ({
      ...prev,
      subjects: prev.subjects.map(subj => {
        if (subj.id === id) {
          const newValue = Math.min(field === 'half_term_score' ? 40 : 60, Math.max(0, value));
          const updatedSubj = { ...subj, [field]: newValue };
          const total = updatedSubj.half_term_score + updatedSubj.exam_score;
          const { grade, remark } = calculateGrade(total);
          
          return {
            ...updatedSubj,
            total_score: total,
            grade,
            teacher_remark: remark
          };
        }
        return subj;
      })
    }));
  };

  const addSubject = () => {
    const newSubject: Subject = {
      id: `subj-${Date.now()}`,
      subject_name: "",
      half_term_score: 0,
      exam_score: 0,
      total_score: 0,
      grade: "",
      teacher_remark: ""
    };
    setReportCard(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject]
    }));
  };

  const removeSubject = (id: string) => {
    setReportCard(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      
      setPhotoFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setReportCard(prev => ({
          ...prev,
          passport_photo_url: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (type: 'class' | 'head', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'class') {
          setClassTeacherSignature(e.target?.result as string);
        } else {
          setHeadTeacherSignature(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addSport = () => {
    if (sportInput.trim()) {
      setReportCard(prev => ({
        ...prev,
        school_sports: [...prev.school_sports, sportInput.trim()]
      }));
      setSportInput("");
    }
  };

  const removeSport = (index: number) => {
    setReportCard(prev => ({
      ...prev,
      school_sports: prev.school_sports.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (activityInput.trim()) {
      setReportCard(prev => ({
        ...prev,
        other_activities: [...prev.other_activities, activityInput.trim()]
      }));
      setActivityInput("");
    }
  };

  const removeActivity = (index: number) => {
    setReportCard(prev => ({
      ...prev,
      other_activities: prev.other_activities.filter((_, i) => i !== index)
    }));
  };

  const calculateSummary = () => {
    const totalObtainable = reportCard.subjects.length * 100;
    const totalObtained = reportCard.subjects.reduce((sum, subj) => sum + subj.total_score, 0);
    const average = reportCard.subjects.length > 0 ? totalObtained / reportCard.subjects.length : 0;
    const percentage = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;
    
    return {
      totalObtainable,
      totalObtained,
      average: average.toFixed(2),
      percentage: percentage.toFixed(1)
    };
  };

  const handleSave = async () => {
    // Validation
    if (!reportCard.student_name || !reportCard.admission_no) {
      toast.error('Please fill in student name and admission number');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to save report cards');
      return;
    }

    setIsSaving(true);

    try {
      const summary = calculateSummary();
      
      // Insert report card
      const { data: reportCardData, error: reportError } = await supabase
        .from('report_cards')
        .insert({
          student_id: user.id, // In production, this should be the actual student ID
          student_name: reportCard.student_name,
          admission_no: reportCard.admission_no,
          date_of_birth: reportCard.date_of_birth || null,
          gender: reportCard.gender,
          class_level: reportCard.class_level,
          academic_session: reportCard.academic_session,
          term: reportCard.term,
          passport_photo_url: reportCard.passport_photo_url,
          total_school_opened: reportCard.total_school_opened,
          times_present: reportCard.times_present,
          times_absent: reportCard.times_absent,
          school_sports: reportCard.school_sports,
          other_activities: reportCard.other_activities,
          conduct_rating: reportCard.conduct_rating,
          conduct_percentage: reportCard.conduct_percentage,
          total_obtainable_score: summary.totalObtainable,
          total_score_obtained: summary.totalObtained,
          average_score: parseFloat(summary.average),
          percentage: parseFloat(summary.percentage),
          club_organization: reportCard.club_organization,
          class_teacher_comments: reportCard.class_teacher_comments,
          head_teacher_comments: reportCard.head_teacher_comments,
          class_teacher_name: reportCard.class_teacher_name,
          head_teacher_name: reportCard.head_teacher_name,
          next_term_begins: reportCard.next_term_begins || null,
          created_by: user.id
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert subjects
      const subjectsToInsert = reportCard.subjects.map(subj => ({
        report_card_id: reportCardData.id,
        subject_name: subj.subject_name,
        half_term_score: subj.half_term_score,
        exam_score: subj.exam_score,
        total_score: subj.total_score,
        grade: subj.grade,
        teacher_remark: subj.teacher_remark
      }));

      const { error: subjectsError } = await supabase
        .from('report_card_subjects')
        .insert(subjectsToInsert);

      if (subjectsError) throw subjectsError;

      toast.success('Report card saved successfully!');
      navigate('/reports');
    } catch (error) {
      console.error('Error saving report card:', error);
      toast.error('Failed to save report card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const missingFields = [];
    if (!reportCard.admission_no) missingFields.push("Admission No");
    if (!reportCard.date_of_birth) missingFields.push("Date of Birth");
    if (!reportCard.gender) missingFields.push("Gender");
    if (!reportCard.total_school_opened) missingFields.push("Total Time School Opened");
    if (!reportCard.times_present) missingFields.push("No. of Time Present");
    if (reportCard.other_activities.length === 0) missingFields.push("Other Organized Activities");
    if (!reportCard.class_teacher_comments) missingFields.push("Class Teacher's comments");
    if (!reportCard.head_teacher_comments) missingFields.push("Head teacher's comments");
    if (!reportCard.head_teacher_name) missingFields.push("Head Teacher's Name");
    if (!reportCard.class_teacher_name) missingFields.push("Class Teacher's Name");
    if (!reportCard.next_term_begins) missingFields.push("Next Term Begins");
    if (!reportCard.passport_photo_url) missingFields.push("Child photo/passport");

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit report cards');
      return;
    }

    setIsSubmitting(true);

    try {
      const summary = calculateSummary();
      
      // Insert report card
      const { data: reportCardData, error: reportError } = await supabase
        .from('report_cards')
        .insert({
          student_id: user.id,
          student_name: reportCard.student_name,
          admission_no: reportCard.admission_no,
          date_of_birth: reportCard.date_of_birth,
          gender: reportCard.gender,
          class_level: reportCard.class_level,
          academic_session: reportCard.academic_session,
          term: reportCard.term,
          passport_photo_url: reportCard.passport_photo_url,
          total_school_opened: reportCard.total_school_opened,
          times_present: reportCard.times_present,
          times_absent: reportCard.times_absent,
          school_sports: reportCard.school_sports,
          other_activities: reportCard.other_activities,
          conduct_rating: reportCard.conduct_rating,
          conduct_percentage: reportCard.conduct_percentage,
          total_obtainable_score: summary.totalObtainable,
          total_score_obtained: summary.totalObtained,
          average_score: parseFloat(summary.average),
          percentage: parseFloat(summary.percentage),
          club_organization: reportCard.club_organization,
          class_teacher_comments: reportCard.class_teacher_comments,
          head_teacher_comments: reportCard.head_teacher_comments,
          class_teacher_name: reportCard.class_teacher_name,
          head_teacher_name: reportCard.head_teacher_name,
          next_term_begins: reportCard.next_term_begins,
          created_by: user.id
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert subjects
      const subjectsToInsert = reportCard.subjects.map(subj => ({
        report_card_id: reportCardData.id,
        subject_name: subj.subject_name,
        half_term_score: subj.half_term_score,
        exam_score: subj.exam_score,
        total_score: subj.total_score,
        grade: subj.grade,
        teacher_remark: subj.teacher_remark
      }));

      const { error: subjectsError } = await supabase
        .from('report_card_subjects')
        .insert(subjectsToInsert);

      if (subjectsError) throw subjectsError;

      toast.success('Report card submitted successfully to admin!');
      navigate('/reports');
    } catch (error) {
      console.error('Error submitting report card:', error);
      toast.error('Failed to submit report card');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-background p-4 print:p-0">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between print:hidden mb-4">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </Button>
            <Button onClick={handlePrint} variant="secondary">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Report Card - Styled like the image */}
        <Card className="shadow-lg print:shadow-none print:border-2 print:border-black">
          <CardContent className="p-6 space-y-4">
            {/* Header with logos and school name */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div className="text-center flex-1">
                <div className="text-red-600 font-bold text-sm">TERMLY VOLUME</div>
                <div className="text-xs">CONTINUOUS ASSESSMENT REPORT</div>
              </div>
              
              <div className="text-center flex-[2]">
                <h1 className="text-2xl font-bold">PRISCILLA SCHOOL</h1>
                <p className="text-xs">59 Oscar Ibru Way, (Formerly Marine Road) G.R.A. Apapa, Lagos</p>
                <p className="text-xs">Tel: +234 803 302 1210, +234 701 987 6174</p>
              </div>
              
              <div className="w-24 h-24 border-2 border-black flex items-center justify-center bg-blue-50 print:hidden">
                {reportCard.passport_photo_url ? (
                  <img src={reportCard.passport_photo_url} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="text-xs cursor-pointer text-blue-600 hover:underline">
                      Upload Photo
                    </label>
                  </div>
                )}
              </div>
              
              {reportCard.passport_photo_url && (
                <div className="w-24 h-24 border-2 border-black hidden print:block">
                  <img src={reportCard.passport_photo_url} alt="Student" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-2 gap-4 text-sm print:hidden">
              <div>
                <Label>Pupil's Name</Label>
                <Input
                  value={reportCard.student_name}
                  onChange={(e) => setReportCard(prev => ({ ...prev, student_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Admission No</Label>
                <Input
                  value={reportCard.admission_no}
                  onChange={(e) => setReportCard(prev => ({ ...prev, admission_no: e.target.value }))}
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={reportCard.date_of_birth}
                  onChange={(e) => setReportCard(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={reportCard.gender} onValueChange={(value) => setReportCard(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Print View of Student Details */}
            <div className="hidden print:block border-b-2 border-black pb-2">
              <div className="grid grid-cols-6 gap-2 text-sm">
                <div className="col-span-3">
                  <span className="font-semibold">Pupil's Name:</span> {reportCard.student_name}
                </div>
                <div className="col-span-1">
                  <span className="font-semibold">Admission No:</span> {reportCard.admission_no}
                </div>
                <div className="col-span-1">
                  <span className="font-semibold">Grade:</span> {reportCard.class_level}
                </div>
                <div className="col-span-1">
                  <span className="font-semibold">Sex:</span> {reportCard.gender}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Date of Birth:</span> {reportCard.date_of_birth}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Year:</span> {reportCard.academic_session}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Term:</span> {reportCard.term}
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 text-center font-bold text-sm p-1 border-b-2 border-black">
                ATTENDANCE (Regularity & Punctuality)
              </div>
              <div className="grid grid-cols-5 text-sm">
                <div className="col-span-2 border-r border-black p-2"></div>
                <div className="border-r border-black p-2 text-center font-semibold">School</div>
                <div className="border-r border-black p-2 text-center font-semibold">Sports</div>
                <div className="p-2 text-center font-semibold">Other Organized Activities</div>
                
                <div className="col-span-2 border-t border-r border-black p-2 print:hidden">
                  <Label>Total Time School Opened</Label>
                  <Input
                    type="number"
                    value={reportCard.total_school_opened}
                    onChange={(e) => setReportCard(prev => ({ ...prev, total_school_opened: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-span-2 hidden print:block border-t border-r border-black p-2 font-semibold">Total Time School Opened</div>
                <div className="border-t border-r border-black p-2 text-center">{reportCard.total_school_opened}</div>
                <div className="border-t border-r border-black p-2 text-center">Aerobics</div>
                <div className="border-t border-black p-2 text-center">Sport Fiesta</div>
                
                <div className="col-span-2 border-t border-r border-black p-2 print:hidden">
                  <Label>No. of Time Present</Label>
                  <Input
                    type="number"
                    value={reportCard.times_present}
                    onChange={(e) => setReportCard(prev => ({ ...prev, times_present: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-span-2 hidden print:block border-t border-r border-black p-2 font-semibold">No. of Time Present</div>
                <div className="border-t border-r border-black p-2 text-center">{reportCard.times_present}</div>
                <div className="border-t border-r border-black p-2 text-center"></div>
                <div className="border-t border-black p-2 text-center">Art Exhibition</div>
                
                <div className="col-span-2 border-t border-r border-black p-2 print:hidden">
                  <Label>No. of Time Absent (Auto-calculated)</Label>
                  <Input
                    type="number"
                    value={reportCard.times_absent}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-2 hidden print:block border-t border-r border-black p-2 font-semibold">No. of Time Absent</div>
                <div className="border-t border-r border-black p-2 text-center">{reportCard.times_absent}</div>
                <div className="border-t border-r border-black p-2 print:hidden">
                  <div className="space-y-2">
                    {reportCard.school_sports.map((sport, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{sport}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeSport(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={sportInput}
                        onChange={(e) => setSportInput(e.target.value)}
                        placeholder="Add sport"
                        className="h-7 text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && addSport()}
                      />
                      <Button size="sm" onClick={addSport} className="h-7">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-r border-black p-2 text-center hidden print:block">{reportCard.school_sports.join(', ')}</div>
                <div className="border-t border-black p-2 print:hidden">
                  <div className="space-y-2">
                    {reportCard.other_activities.map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span>{activity}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeActivity(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={activityInput}
                        onChange={(e) => setActivityInput(e.target.value)}
                        placeholder="Add activity"
                        className="h-7 text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                      />
                      <Button size="sm" onClick={addActivity} className="h-7">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-black p-2 text-center hidden print:block">{reportCard.other_activities.join(', ')}</div>
              </div>
            </div>

            {/* Conduct */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 text-center font-bold text-sm p-1 border-b border-black">CONDUCT</div>
              <div className="grid grid-cols-8 text-sm">
                <div className="col-span-1 flex items-center justify-center p-2 border-r border-black">
                  <div className="w-8 h-8 bg-green-500"></div>
                  <span className="ml-1 text-xs">Green for Exemplary Conduct</span>
                </div>
                <div className="col-span-1 flex items-center justify-center p-2 border-r border-black">
                  <div className="w-8 h-8 bg-red-500"></div>
                  <span className="ml-1 text-xs">Red for Bad Conduct</span>
                </div>
                <div className="col-span-1 border-r border-black p-2 text-center">
                  <div className="font-semibold">Number %:</div>
                  <div>{reportCard.conduct_percentage}%</div>
                </div>
                <div className="col-span-2 border-r border-black p-2 text-center">
                  <div className="font-semibold">Conduct</div>
                  <div>{reportCard.conduct_rating}</div>
                </div>
                <div className="col-span-1 border-r border-black p-2 text-center">
                  <div className="font-semibold">Number %</div>
                </div>
                <div className="col-span-1 border-r border-black p-2 text-center">
                  <div className="font-semibold">Conduct</div>
                </div>
                <div className="col-span-1 p-2 text-center">
                  <div className="font-semibold">{reportCard.conduct_rating}</div>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="border-2 border-black">
              <div className="bg-gray-200 text-center font-bold text-sm p-1 border-b-2 border-black">
                TERMLY ASSESSMENT REPORT
              </div>
              <div className="grid grid-cols-12 text-xs font-semibold bg-purple-100 border-b border-black">
                <div className="col-span-4 p-2 border-r border-black">SUBJECTS</div>
                <div className="col-span-1 p-2 border-r border-black text-center">Half Term<br/>Scores 40</div>
                <div className="col-span-1 p-2 border-r border-black text-center">Exam<br/>Scores<br/>60</div>
                <div className="col-span-1 p-2 border-r border-black text-center">Total<br/>Scores 100</div>
                <div className="col-span-1 p-2 border-r border-black text-center">Grade</div>
                <div className="col-span-4 p-2">Teacher's Remarks</div>
              </div>
              
              {reportCard.subjects.map((subject, index) => (
                <div key={subject.id} className="grid grid-cols-12 text-xs border-b border-black print:break-inside-avoid">
                  <div className="col-span-4 p-2 border-r border-black font-semibold print:hidden">
                    <Input
                      value={subject.subject_name}
                      onChange={(e) => setReportCard(prev => ({
                        ...prev,
                        subjects: prev.subjects.map(s => s.id === subject.id ? { ...s, subject_name: e.target.value } : s)
                      }))}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-4 p-2 border-r border-black font-semibold hidden print:block">{subject.subject_name}</div>
                  
                  <div className="col-span-1 p-2 border-r border-black text-center print:hidden">
                    <Input
                      type="number"
                      min="0"
                      max="40"
                      value={subject.half_term_score}
                      onChange={(e) => updateSubjectScore(subject.id, 'half_term_score', parseInt(e.target.value) || 0)}
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="col-span-1 p-2 border-r border-black text-center hidden print:block">{subject.half_term_score}</div>
                  
                  <div className="col-span-1 p-2 border-r border-black text-center print:hidden">
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={subject.exam_score}
                      onChange={(e) => updateSubjectScore(subject.id, 'exam_score', parseInt(e.target.value) || 0)}
                      className="h-8 text-center"
                    />
                  </div>
                  <div className="col-span-1 p-2 border-r border-black text-center hidden print:block">{subject.exam_score}</div>
                  
                  <div className="col-span-1 p-2 border-r border-black text-center font-bold">{subject.total_score}</div>
                  <div className="col-span-1 p-2 border-r border-black text-center font-bold">{subject.grade}</div>
                  <div className="col-span-4 p-2 font-semibold">{subject.teacher_remark}</div>
                  
                  <div className="col-span-12 print:hidden border-t border-black p-1 flex justify-end">
                    <Button size="sm" variant="destructive" onClick={() => removeSubject(subject.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="print:hidden p-2 border-t-2 border-black">
                <Button size="sm" onClick={addSubject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="border-2 border-black">
              <div className="grid grid-cols-12 text-sm">
                <div className="col-span-4 p-2 border-r border-black font-bold">Total Obtainable Score</div>
                <div className="col-span-2 p-2 border-r border-black text-center font-bold">{summary.totalObtainable}</div>
                <div className="col-span-2 p-2 border-r border-black"></div>
                <div className="col-span-2 p-2 border-r border-black"></div>
                <div className="col-span-2 p-2"></div>
                
                <div className="col-span-4 p-2 border-t border-r border-black font-bold">Total Score Obtained</div>
                <div className="col-span-2 p-2 border-t border-r border-black text-center font-bold">{summary.totalObtained}</div>
                <div className="col-span-2 p-2 border-t border-r border-black font-bold">Average:</div>
                <div className="col-span-1 p-2 border-t border-r border-black text-center">{summary.average}</div>
                <div className="col-span-2 p-2 border-t border-r border-black font-bold">Percentage %</div>
                <div className="col-span-1 p-2 border-t text-center">{summary.percentage}%</div>
              </div>
            </div>

            {/* Comments - Print only */}
            <div className="grid grid-cols-2 gap-4 text-sm print:hidden mt-4">
              <div>
                <Label>Class Teacher's Comments</Label>
                <Textarea
                  value={reportCard.class_teacher_comments}
                  onChange={(e) => setReportCard(prev => ({ ...prev, class_teacher_comments: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Head Teacher's Comments</Label>
                <Textarea
                  value={reportCard.head_teacher_comments}
                  onChange={(e) => setReportCard(prev => ({ ...prev, head_teacher_comments: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>Class Teacher's Name</Label>
                <Input
                  value={reportCard.class_teacher_name}
                  onChange={(e) => setReportCard(prev => ({ ...prev, class_teacher_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Head Teacher's Name</Label>
                <Input
                  value={reportCard.head_teacher_name}
                  onChange={(e) => setReportCard(prev => ({ ...prev, head_teacher_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Class Teacher's Signature</Label>
                <div className="flex items-center gap-2">
                  {classTeacherSignature && (
                    <img src={classTeacherSignature} alt="Signature" className="h-16 border" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSignatureUpload('class', e)}
                  />
                </div>
              </div>
              <div>
                <Label>Head Teacher's Signature</Label>
                <div className="flex items-center gap-2">
                  {headTeacherSignature && (
                    <img src={headTeacherSignature} alt="Signature" className="h-16 border" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSignatureUpload('head', e)}
                  />
                </div>
              </div>
              <div>
                <Label>Next Term Begins</Label>
                <Input
                  type="date"
                  value={reportCard.next_term_begins}
                  onChange={(e) => setReportCard(prev => ({ ...prev, next_term_begins: e.target.value }))}
                />
              </div>
            </div>

            {/* Comments Print View */}
            <div className="hidden print:block border-t-2 border-black pt-4 space-y-2 text-sm">
              <div>
                <span className="font-bold">Club/Organization:</span> {reportCard.club_organization}
              </div>
              <div>
                <span className="font-bold">Class Teacher's Comments:</span> {reportCard.class_teacher_comments}
              </div>
              <div>
                <span className="font-bold">Head Teacher's Comments:</span> {reportCard.head_teacher_comments}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="font-bold">Class Teacher's Name and Signature</div>
                  <div className="border-t-2 border-black mt-8 pt-2">{reportCard.class_teacher_name}</div>
                </div>
                <div>
                  <div className="font-bold">Head Teacher's Name and Signature</div>
                  <div className="border-t-2 border-black mt-8 pt-2">{reportCard.head_teacher_name}</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <span className="font-bold">Next Term Begins:</span> {reportCard.next_term_begins}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentReportCardSystem;
