import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Printer, Save, Send, Upload, MoreVertical, Plus, Trash2, Edit2, Check, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BackConfirmDialog } from "@/components/teacher/BackConfirmDialog";

import coatOfArmsImg from "@/assets/ng-coat-of-arms.jpg";
import schoolLogoImg from "@/assets/priscilla-school-logo.png";
import mickeyImg from "@/assets/mickey.png";
import cloudImg from "@/assets/cloud-img.png";
import childrenOnBooksImg from "@/assets/children-on-books.png";
import abcBlocksImg from "@/assets/abc-blocks.png";
import boysOnPencilImg from "@/assets/boys-on-pencil.png";

export interface NurseryExamSubject {
  id: string;
  name: string;
  halfTerm: number | null;
  exam: number | null;
  total: number;
  grade: string;
  remark: string;
}

export interface NurseryExamTemplateProps {
  classLabel: string;            // e.g. "Nursery One"
  classLabelUpper: string;       // e.g. "NURSERY ONE"
  defaultSubjects: string[];     // subject names
  backPath?: string;             // teacher/upload-result
}

const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
const onlyAlpha = (v: string) => v.replace(/[^A-Za-z\s'.-]/g, "");
const sanitizeAcademicYear = (v: string) => {
  const cleaned = v.replace(/[^0-9/]/g, "");
  const slash = cleaned.indexOf("/");
  if (slash === -1) return cleaned;
  return cleaned.slice(0, slash + 1) + cleaned.slice(slash + 1).replace(/\//g, "");
};
const isValidAcademicYear = (v: string) => /^\d{4}\/\d{4}$/.test(v.trim());

function calculateGrade(total: number): { grade: string; remark: string } {
  if (total >= 75) return { grade: "A", remark: "Excellent" };
  if (total >= 65) return { grade: "B", remark: "Very Good" };
  if (total >= 55) return { grade: "C", remark: "Good" };
  if (total >= 45) return { grade: "D", remark: "Fair" };
  if (total >= 40) return { grade: "E", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

const NurseryExamResultTemplate = ({
  classLabel,
  classLabelUpper,
  defaultSubjects,
  backPath = "/teacher/upload-result",
}: NurseryExamTemplateProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [classTeacherSignature, setClassTeacherSignature] = useState<string | null>(null);
  const [schoolStamp, setSchoolStamp] = useState<string | null>(null);

  const [reportData, setReportData] = useState({
    pupilName: "",
    admissionNo: "",
    gender: "",
    dateOfBirth: "",
    academicYear: searchParams.get("session") || "",
    term: searchParams.get("term") || "",
    numberInClass: "",
    grade: searchParams.get("grade") || classLabel,
    position: "",
    nextTermBegins: "",
  });

  const [attendance, setAttendance] = useState({
    schoolOpened: searchParams.get("totalOpened") || "",
    schoolPresent: "",
    schoolAbsent: "",
    sportsOpened: "",
    sportsPresent: "",
    sportsAbsent: "",
    otherActivities: ["", "", ""],
  });

  const [conduct, setConduct] = useState({ rating: 95, label: "Exemplary" });

  const [subjects, setSubjects] = useState<NurseryExamSubject[]>(
    defaultSubjects.map((name, i) => ({
      id: `subj-${i}-${Date.now()}`, name, halfTerm: null, exam: null, total: 0, grade: "", remark: "",
    })),
  );
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");

  const [classTeacherComment, setClassTeacherComment] = useState("");
  const [headTeacherComment, setHeadTeacherComment] = useState("");
  const [classTeacherName, setClassTeacherName] = useState("");
  const [headTeacherName, setHeadTeacherName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto compute absent
  useEffect(() => {
    const opened = parseInt(attendance.schoolOpened) || 0;
    const present = parseInt(attendance.schoolPresent) || 0;
    setAttendance((p) => ({ ...p, schoolAbsent: String(Math.max(0, opened - present)) }));
  }, [attendance.schoolOpened, attendance.schoolPresent]);

  const updateSubjectScore = (index: number, field: "halfTerm" | "exam", raw: string) => {
    const next = [...subjects];
    const parsed = raw === "" ? null : Math.max(0, Math.min(field === "halfTerm" ? 40 : 60, Number(raw) || 0));
    next[index] = { ...next[index], [field]: parsed };
    const ht = next[index].halfTerm ?? 0;
    const ex = next[index].exam ?? 0;
    const hasAny = next[index].halfTerm !== null || next[index].exam !== null;
    const total = ht + ex;
    if (hasAny) {
      const { grade, remark } = calculateGrade(total);
      next[index].total = total;
      next[index].grade = grade;
      next[index].remark = remark;
    } else {
      next[index].total = 0; next[index].grade = ""; next[index].remark = "";
    }
    setSubjects(next);
  };

  const addSubject = () => {
    setSubjects((p) => [
      ...p,
      { id: `subj-${Date.now()}`, name: "New Subject", halfTerm: null, exam: null, total: 0, grade: "", remark: "" },
    ]);
  };
  const deleteSubject = (id: string) => setSubjects((p) => p.filter((s) => s.id !== id));
  const startEditSubject = (id: string, name: string) => { setEditingSubjectId(id); setEditingSubjectName(name); };
  const saveEditSubject = () => {
    if (!editingSubjectName.trim()) return;
    setSubjects((p) => p.map((s) => s.id === editingSubjectId ? { ...s, name: editingSubjectName.trim() } : s));
    setEditingSubjectId(null); setEditingSubjectName("");
  };

  const summary = (() => {
    const totalObtainable = subjects.length * 100;
    const totalObtained = subjects.reduce((s, x) => s + x.total, 0);
    const average = subjects.length ? (totalObtained / subjects.length).toFixed(2) : "0.00";
    const percentage = totalObtainable
      ? ((totalObtained / totalObtainable) * 100).toFixed(2)
      : "0.00";
    return { totalObtainable, totalObtained, average, percentage };
  })();

  const handleFileUpload = (setter: (v: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const r = new FileReader();
    r.onloadend = () => setter(r.result as string);
    r.readAsDataURL(file);
  };

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!reportData.pupilName.trim()) errs.pupilName = "Required";
    if (!reportData.gender) errs.gender = "Required";
    if (!reportData.term) errs.term = "Required";
    if (!reportData.academicYear.trim()) errs.academicYear = "Required";
    else if (!isValidAcademicYear(reportData.academicYear)) errs.academicYear = "Format YYYY/YYYY";
    if (!classTeacherName.trim()) errs.classTeacherName = "Required";
    if (!headTeacherName.trim()) errs.headTeacherName = "Required";
    if (!classTeacherComment.trim()) errs.classTeacherComment = "Required";
    if (!headTeacherComment.trim()) errs.headTeacherComment = "Required";
    if (!classTeacherSignature) errs.classTeacherSignature = "Required";
    if (!schoolStamp) errs.schoolStamp = "Required";
    return errs;
  }, [reportData, classTeacherName, headTeacherName, classTeacherComment, headTeacherComment, classTeacherSignature, schoolStamp]);

  const isFormValid = Object.keys(validate()).length === 0;

  const buildPayload = () => ({
    student_name: reportData.pupilName.trim(),
    admission_no: reportData.admissionNo,
    gender: reportData.gender,
    date_of_birth: reportData.dateOfBirth || null,
    class_level: reportData.grade,
    academic_session: reportData.academicYear.trim(),
    term: reportData.term,
    total_school_opened: parseInt(attendance.schoolOpened) || 0,
    times_present: parseInt(attendance.schoolPresent) || 0,
    times_absent: parseInt(attendance.schoolAbsent) || 0,
    conduct_percentage: conduct.rating,
    conduct_rating: conduct.label,
    total_obtainable_score: summary.totalObtainable,
    total_score_obtained: summary.totalObtained,
    average_score: parseFloat(summary.average),
    percentage: parseFloat(summary.percentage),
    position: reportData.position,
    class_teacher_comments: classTeacherComment,
    head_teacher_comments: headTeacherComment,
    class_teacher_name: classTeacherName,
    head_teacher_name: headTeacherName,
    next_term_begins: reportData.nextTermBegins || null,
    passport_photo_url: passportPhoto,
    created_by: user?.id,
    student_id: user?.id,
  });

  const persist = async (asDraft: boolean) => {
    if (!user) { toast.error("Not authenticated"); return; }
    const setter = asDraft ? setIsSavingDraft : setIsSubmitting;
    setter(true);
    try {
      const { data: rc, error } = await supabase
        .from("report_cards")
        .insert(buildPayload())
        .select()
        .single();
      if (error) throw error;
      const subjectRows = subjects.map((s) => ({
        report_card_id: rc.id,
        subject_name: s.name,
        half_term_score: s.halfTerm,
        exam_score: s.exam,
        total_score: s.total,
        grade: s.grade,
        teacher_remark: s.remark,
      }));
      const { error: sErr } = await supabase
        .from("report_card_subjects")
        .insert(subjectRows);
      if (sErr) throw sErr;

      toast.success(asDraft ? "Draft saved" : `${classLabel} examination result submitted!`);
      if (!asDraft) navigate("/reports");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setter(false);
    }
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setValidationErrors(errs);
      toast.error("Please complete all required fields");
      return;
    }
    setValidationErrors({});
    persist(false);
  };

  const handlePrint = () => window.print();

  const ErrorMsg = ({ field }: { field: string }) =>
    validationErrors[field] ? <p className="text-red-500 text-[10px] mt-0.5">{validationErrors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .deco-boys-pencil { height: 90px; width: auto; transform: rotate(-25deg); transform-origin: bottom center; pointer-events: none; }
        .deco-abc-blocks { height: 70px; width: auto; pointer-events: none; }
        .contact-line { white-space: nowrap; overflow: visible; }
        .subject-row .subject-actions { opacity: 0; transition: opacity .2s; }
        .subject-row:hover .subject-actions { opacity: 1; }
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
          html, body { width: 210mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { font-size: 8.5pt !important; max-width: 100% !important; padding: 0 !important; }
          .print-container table { font-size: 8pt !important; }
          .deco-boys-pencil { height: 22mm !important; }
          .deco-abc-blocks { height: 20mm !important; }
          .contact-line { font-size: 7pt !important; }
        }
        @media (max-width: 640px) {
          .contact-line { font-size: 7px; }
          .deco-boys-pencil { height: 56px; }
          .deco-abc-blocks { height: 44px; }
        }
      `}</style>

      {/* Top bar */}
      <header className="bg-gradient-to-r from-emerald-700 to-green-800 text-white py-4 px-4 sm:px-6 shadow-medium no-print fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setShowBackConfirm(true)}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold truncate">{classLabel} – Examination Result</h1>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button onClick={handlePrint} variant="secondary"><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button onClick={() => persist(true)} variant="outline" className="text-white border-white hover:bg-white/20" disabled={isSavingDraft}>
              <Save className="h-4 w-4 mr-2" />{isSavingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !isFormValid} title={!isFormValid ? "Fill all required fields" : ""}>
              <Send className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20"><MoreVertical className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</DropdownMenuItem>
                <DropdownMenuItem onClick={() => persist(true)} disabled={isSavingDraft}><Save className="h-4 w-4 mr-2" />{isSavingDraft ? "Saving..." : "Save Draft"}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSubmit} disabled={isSubmitting || !isFormValid}><Send className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="pt-20 sm:pt-24" />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 print-container">
        <Card className="shadow-lg print:shadow-none print:border-2 print:border-emerald-800 border-2 border-emerald-700 relative overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-0">

            {/* HEADER */}
            <div className="border-b-2 border-emerald-700 pb-2">
              <div className="grid items-center gap-1 grid-cols-[auto_1fr_auto]">
                {/* LEFT: coat + mickey */}
                <div className="flex items-center -mr-3 sm:-mr-6 relative z-20">
                  <div className="flex flex-col items-center">
                    <img src={coatOfArmsImg} alt="Nigeria Coat of Arms" className="object-contain h-8 w-8 sm:h-14 sm:w-14" />
                    <p className="text-red-600 font-extrabold uppercase tracking-wider text-[6px] sm:text-[10px] leading-tight mt-0.5 whitespace-nowrap text-center">TERMLY VOLUME</p>
                    <p className="text-black font-extrabold uppercase text-[5px] sm:text-[8px] leading-tight whitespace-nowrap text-center">EXAMINATION RESULT REPORT</p>
                  </div>
                  <img src={mickeyImg} alt="Mickey Mouse" className="object-contain h-14 sm:h-24 w-auto -ml-1" />
                </div>

                {/* CENTER: cloud + logo + school name */}
                <div className="relative flex items-center justify-center min-h-[100px] sm:min-h-[170px] mx-auto w-full sm:w-[460px] px-1">
                  <img src={cloudImg} alt="" aria-hidden="true"
                    className="pointer-events-none absolute inset-0 w-full h-full object-fill opacity-70"
                    style={{ zIndex: 1 }} />
                  <div className="relative text-center px-1 py-1 max-w-full" style={{ zIndex: 10 }}>
                    <img src={schoolLogoImg} alt="Priscilla School" className="mx-auto object-contain h-10 w-10 sm:h-20 sm:w-20" />
                    <h1 className="text-[clamp(0.85rem,3.6vw,2.25rem)] font-extrabold text-emerald-800 tracking-wide leading-tight break-words">PRISCILLA SCHOOL</h1>
                    <p className="text-[7px] sm:text-xs text-emerald-700 leading-tight break-words">59 Oscar Ibru Way, (Formerly Marine Road) G.R.A. Apapa, Lagos</p>
                    <p className="contact-line text-[7px] sm:text-xs leading-tight">
                      <span className="text-red-600 font-semibold">Tel:</span>{" "}
                      <span className="text-emerald-700">+234 803 302 1210, +234 701 987 6174</span>
                      <span className="mx-1">|</span>
                      <span className="text-red-600 font-semibold">Email:</span>{" "}
                      <span className="text-emerald-700">priscillaschool@gmail.com</span>
                    </p>
                  </div>
                </div>

                {/* RIGHT: children-on-books + passport */}
                <div className="flex items-center -ml-3 sm:-ml-6 relative z-20">
                  <img src={childrenOnBooksImg} alt="Children on books" className="object-contain h-14 sm:h-28 w-auto -mr-1" />
                  <div className="border-2 border-emerald-700 bg-emerald-50 flex items-center justify-center overflow-hidden w-12 h-16 sm:w-16 sm:h-20">
                    {passportPhoto ? (
                      <div className="relative w-full h-full group">
                        <img src={passportPhoto} alt="Student" className="w-full h-full object-cover" />
                        <input id="exam-photo-replace" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setPassportPhoto)} />
                        <label htmlFor="exam-photo-replace" className="absolute inset-0 bg-black/60 text-white text-[8px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer no-print">
                          <Upload className="h-3 w-3 mb-0.5" /> Replace
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="exam-photo" className="text-[7px] text-center cursor-pointer text-emerald-700 no-print p-0.5">
                        <Upload className="h-3 w-3 mx-auto mb-0.5" />Upload Photo
                      </label>
                    )}
                    <input id="exam-photo" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setPassportPhoto)} />
                  </div>
                </div>
              </div>

              <h2 className="text-center text-sm sm:text-xl font-bold text-emerald-900 mt-2 break-words">
                TERMLY EXAMINATION REPORT FOR {classLabelUpper}
              </h2>
            </div>

            {/* PUPIL INFORMATION */}
            <div className="border-2 border-emerald-700 text-xs sm:text-sm">
              <div className="grid grid-cols-2 border-b border-emerald-700">
                <div className="p-1 sm:p-2 border-r border-emerald-700">
                  <span className="font-bold italic text-emerald-800">Pupil's Name:</span>
                  <Input value={reportData.pupilName} onChange={(e) => setReportData({ ...reportData, pupilName: onlyAlpha(e.target.value) })}
                    className={`h-7 text-xs mt-0.5 no-print ${validationErrors.pupilName ? 'border-red-500' : ''}`} />
                  <span className="hidden print:inline ml-2">{reportData.pupilName}</span>
                  <ErrorMsg field="pupilName" />
                </div>
                <div className="p-1 sm:p-2">
                  <span className="font-bold italic text-emerald-800">Admission No:</span>
                  <Input value={reportData.admissionNo} inputMode="numeric" pattern="[0-9]*"
                    onChange={(e) => setReportData({ ...reportData, admissionNo: onlyDigits(e.target.value) })}
                    className="h-7 text-xs mt-0.5 no-print" placeholder="Numbers only" />
                  <span className="hidden print:inline ml-2">{reportData.admissionNo}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-emerald-700">
                <div className="p-1 sm:p-2 border-r border-emerald-700">
                  <span className="font-bold italic text-emerald-800">Sex:</span>
                  <div className="no-print mt-0.5">
                    <Select value={reportData.gender} onValueChange={(v) => setReportData({ ...reportData, gender: v })}>
                      <SelectTrigger className={`h-7 text-xs ${validationErrors.gender ? 'border-red-500' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="hidden print:inline ml-2">{reportData.gender}</span>
                  <ErrorMsg field="gender" />
                </div>
                <div className="p-1 sm:p-2 border-r border-emerald-700">
                  <span className="font-bold italic text-emerald-800">Class:</span>
                  <Input value={reportData.grade} readOnly className="h-7 text-xs mt-0.5 no-print bg-muted" />
                  <span className="hidden print:inline ml-2">{reportData.grade}</span>
                </div>
                <div className="p-1 sm:p-2 border-r border-emerald-700">
                  <span className="font-bold italic text-emerald-800">Term:</span>
                  <div className="no-print mt-0.5">
                    <Select value={reportData.term} onValueChange={(v) => setReportData({ ...reportData, term: v })}>
                      <SelectTrigger className={`h-7 text-xs ${validationErrors.term ? 'border-red-500' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Term">First Term</SelectItem>
                        <SelectItem value="Second Term">Second Term</SelectItem>
                        <SelectItem value="Third Term">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="hidden print:inline ml-2">{reportData.term}</span>
                  <ErrorMsg field="term" />
                </div>
                <div className="p-1 sm:p-2">
                  <span className="font-bold italic text-emerald-800">Academic Year:</span>
                  <Input value={reportData.academicYear} placeholder="YYYY/YYYY" maxLength={9} inputMode="numeric"
                    onChange={(e) => setReportData({ ...reportData, academicYear: sanitizeAcademicYear(e.target.value) })}
                    className={`h-7 text-xs mt-0.5 no-print ${validationErrors.academicYear ? 'border-red-500' : ''}`} />
                  <span className="hidden print:inline ml-2">{reportData.academicYear}</span>
                  <ErrorMsg field="academicYear" />
                </div>
              </div>
            </div>

            {/* ATTENDANCE & CONDUCT */}
            <div className="border-2 border-emerald-700 border-t-0">
              <div className="bg-emerald-100 text-center font-bold text-xs sm:text-sm p-1 border-b border-emerald-700 text-emerald-900">
                ATTENDANCE &amp; CONDUCT
              </div>
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-emerald-50">
                    <th className="border border-emerald-700 p-1 text-left w-2/5"></th>
                    <th className="border border-emerald-700 p-1 text-center text-emerald-800">School</th>
                    <th className="border border-emerald-700 p-1 text-center text-emerald-800">Sports</th>
                    <th className="border border-emerald-700 p-1 text-center text-emerald-800">Other Activities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-emerald-700 p-1 font-semibold text-emerald-800">Total Times Opened</td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input inputMode="numeric" value={attendance.schoolOpened}
                        onChange={(e) => setAttendance({ ...attendance, schoolOpened: onlyDigits(e.target.value) })}
                        className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolOpened}</span>
                    </td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.sportsOpened} onChange={(e) => setAttendance({ ...attendance, sportsOpened: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Football" />
                      <span className="hidden print:inline">{attendance.sportsOpened}</span>
                    </td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.otherActivities[0]} onChange={(e) => { const a = [...attendance.otherActivities]; a[0] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="Open Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[0]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-emerald-700 p-1 font-semibold text-emerald-800">Times Present</td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input inputMode="numeric" value={attendance.schoolPresent} onChange={(e) => setAttendance({ ...attendance, schoolPresent: onlyDigits(e.target.value) })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolPresent}</span>
                    </td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.sportsPresent} onChange={(e) => setAttendance({ ...attendance, sportsPresent: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.sportsPresent}</span>
                    </td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.otherActivities[1]} onChange={(e) => { const a = [...attendance.otherActivities]; a[1] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="Friendship Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[1]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-emerald-700 p-1 font-semibold text-emerald-800">Times Absent</td>
                    <td className="border border-emerald-700 p-1 text-center"><span>{attendance.schoolAbsent}</span></td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.sportsAbsent} onChange={(e) => setAttendance({ ...attendance, sportsAbsent: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.sportsAbsent}</span>
                    </td>
                    <td className="border border-emerald-700 p-1 text-center">
                      <Input value={attendance.otherActivities[2]} onChange={(e) => { const a = [...attendance.otherActivities]; a[2] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="Maths Exhibition" />
                      <span className="hidden print:inline">{attendance.otherActivities[2]}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-emerald-700 p-2 flex items-center gap-3">
                <span className="font-bold italic text-emerald-800 text-xs sm:text-sm">Conduct:</span>
                <div className="flex-1 bg-emerald-50 rounded-full h-5 overflow-hidden border border-emerald-300">
                  <div className={`h-full flex items-center justify-center text-white text-[10px] font-bold ${conduct.rating >= 70 ? 'bg-emerald-600' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, conduct.rating))}%` }}>
                    {conduct.rating}%
                  </div>
                </div>
                <Input type="number" min={0} max={100} value={conduct.rating}
                  onChange={(e) => {
                    const n = parseInt(e.target.value || "0");
                    setConduct({ ...conduct, rating: Math.max(0, Math.min(100, isNaN(n) ? 0 : n)) });
                  }}
                  className="h-7 w-16 text-xs no-print" />
                <Input value={conduct.label}
                  onChange={(e) => setConduct({ ...conduct, label: onlyAlpha(e.target.value) })}
                  className="h-7 w-28 text-xs no-print" placeholder="Rating" />
              </div>
            </div>

            {/* TERMLY ASSESSMENT TABLE */}
            <div className="border-2 border-emerald-700 border-t-0">
              <div className="bg-emerald-100 text-center font-bold text-xs sm:text-sm p-1 border-b border-emerald-700 text-emerald-900">
                TERMLY ASSESSMENT REPORT
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-emerald-200 text-emerald-900">
                      <th className="border border-emerald-700 p-1 text-left">Subjects</th>
                      <th className="border border-emerald-700 p-1">Half Term (40)</th>
                      <th className="border border-emerald-700 p-1">Exam (60)</th>
                      <th className="border border-emerald-700 p-1">Total (100)</th>
                      <th className="border border-emerald-700 p-1">Grade</th>
                      <th className="border border-emerald-700 p-1">Teacher's Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => (
                      <tr key={s.id} className="hover:bg-emerald-50/40 subject-row">
                        <td className="border border-emerald-700 p-1 font-medium text-emerald-900">
                          {editingSubjectId === s.id ? (
                            <div className="flex items-center gap-1 no-print">
                              <Input value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)}
                                className="h-6 text-xs flex-1" autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEditSubject()} />
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEditSubject}>
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingSubjectId(null)}>
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{s.name}</span>
                              <div className="subject-actions flex gap-0.5 no-print">
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => startEditSubject(s.id, s.name)}>
                                  <Edit2 className="h-3 w-3 text-emerald-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => deleteSubject(s.id)}>
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="border border-emerald-700 p-0.5">
                          <Input type="number" min={0} max={40}
                            value={s.halfTerm ?? ""} onChange={(e) => updateSubjectScore(i, "halfTerm", e.target.value)}
                            className="h-7 text-xs text-center no-print w-full" />
                          <span className="hidden print:inline">{s.halfTerm ?? ""}</span>
                        </td>
                        <td className="border border-emerald-700 p-0.5">
                          <Input type="number" min={0} max={60}
                            value={s.exam ?? ""} onChange={(e) => updateSubjectScore(i, "exam", e.target.value)}
                            className="h-7 text-xs text-center no-print w-full" />
                          <span className="hidden print:inline">{s.exam ?? ""}</span>
                        </td>
                        <td className="border border-emerald-700 p-1 text-center font-bold text-emerald-900">{s.total || ""}</td>
                        <td className="border border-emerald-700 p-1 text-center font-bold text-emerald-700">{s.grade}</td>
                        <td className="border border-emerald-700 p-1 text-center">{s.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="no-print px-2 py-1 border-t border-emerald-700 bg-emerald-50">
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={addSubject}>
                    <Plus className="h-3 w-3 mr-1" />Add Subject
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-emerald-50 border-t border-emerald-700 text-xs sm:text-sm">
                <div className="text-center">
                  <p className="text-emerald-700 font-semibold">Total Obtainable</p>
                  <p className="font-bold text-emerald-900">{summary.totalObtainable}</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-700 font-semibold">Total Obtained</p>
                  <p className="font-bold text-emerald-900">{summary.totalObtained}</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-700 font-semibold">Average</p>
                  <p className="font-bold text-emerald-900">{summary.average}</p>
                </div>
                <div className="text-center">
                  <p className="text-emerald-700 font-semibold">Position</p>
                  <Input value={reportData.position} onChange={(e) => setReportData({ ...reportData, position: e.target.value })}
                    className="h-6 text-xs text-center no-print" placeholder="e.g. 1st" />
                  <span className="hidden print:inline font-bold">{reportData.position}</span>
                </div>
              </div>
            </div>

            {/* COMMENTS */}
            <div className="border-2 border-emerald-700 border-t-0 text-xs sm:text-sm">
              <div className="border-b border-emerald-700 p-2">
                <span className="font-bold italic text-emerald-800">Class Teacher's Comment:</span>
                <Textarea value={classTeacherComment} onChange={(e) => setClassTeacherComment(e.target.value)} rows={2}
                  className={`mt-1 text-xs no-print ${validationErrors.classTeacherComment ? 'border-red-500' : ''}`} />
                <span className="hidden print:inline text-emerald-700 ml-2 italic">{classTeacherComment}</span>
                <ErrorMsg field="classTeacherComment" />
              </div>
              <div className="p-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold italic text-emerald-800">Head Teacher's Comment:</span>
                    <Textarea value={headTeacherComment} onChange={(e) => setHeadTeacherComment(e.target.value)} rows={2}
                      className={`mt-1 text-xs no-print ${validationErrors.headTeacherComment ? 'border-red-500' : ''}`} />
                    <span className="hidden print:inline text-emerald-700 ml-2 italic">{headTeacherComment}</span>
                    <ErrorMsg field="headTeacherComment" />
                  </div>
                  <img src={abcBlocksImg} alt="" aria-hidden="true" className="deco-abc-blocks shrink-0" />
                </div>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="border-2 border-emerald-700 border-t-0 p-3 text-xs sm:text-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-1 flex flex-col items-center text-center relative">
                  <img src={boysOnPencilImg} alt="" aria-hidden="true" className="deco-boys-pencil mb-1 self-start" />
                  <Input value={classTeacherName} onChange={(e) => setClassTeacherName(onlyAlpha(e.target.value))}
                    className={`h-7 text-xs no-print font-bold text-center ${validationErrors.classTeacherName ? 'border-red-500' : ''}`}
                    placeholder="Class Teacher's Name" />
                  <span className="hidden print:block font-bold text-emerald-800 uppercase">{classTeacherName}</span>
                  <ErrorMsg field="classTeacherName" />
                  <div className={`w-full h-14 sm:h-16 border-2 border-dashed flex items-center justify-center overflow-hidden no-print ${validationErrors.classTeacherSignature ? 'border-red-500' : 'border-emerald-400'}`}>
                    {classTeacherSignature ? (
                      <img src={classTeacherSignature} alt="Signature" className="max-h-full object-contain" />
                    ) : (
                      <label htmlFor="exam-teacher-sig" className="text-[8px] text-emerald-600 cursor-pointer flex flex-col items-center">
                        <Upload className="h-3 w-3 mb-0.5" />Upload Signature
                      </label>
                    )}
                    <input id="exam-teacher-sig" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setClassTeacherSignature)} />
                  </div>
                  {classTeacherSignature && (
                    <div className="hidden print:block h-14"><img src={classTeacherSignature} alt="Signature" className="max-h-full object-contain" /></div>
                  )}
                  <ErrorMsg field="classTeacherSignature" />
                  <p className="text-[10px] italic text-emerald-700 border-t border-emerald-700 pt-1 w-full">Class Teacher's Name and Signature</p>
                </div>

                <div className="flex-1 text-right space-y-1 relative">
                  <Input value={headTeacherName} onChange={(e) => setHeadTeacherName(onlyAlpha(e.target.value))}
                    className={`h-7 text-xs no-print font-bold text-right ${validationErrors.headTeacherName ? 'border-red-500' : ''}`}
                    placeholder="Head Teacher's Name" />
                  <span className="hidden print:block font-bold text-emerald-800 uppercase">{headTeacherName}</span>
                  <ErrorMsg field="headTeacherName" />
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed ml-auto flex items-center justify-center overflow-hidden no-print ${validationErrors.schoolStamp ? 'border-red-500' : 'border-emerald-400'}`}>
                    {schoolStamp ? (
                      <img src={schoolStamp} alt="School Stamp" className="w-full h-full object-contain" />
                    ) : (
                      <label htmlFor="exam-school-stamp" className="text-[7px] text-emerald-600 cursor-pointer flex flex-col items-center">
                        <Upload className="h-3 w-3 mb-0.5" />Stamp
                      </label>
                    )}
                    <input id="exam-school-stamp" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setSchoolStamp)} />
                  </div>
                  {schoolStamp && (
                    <div className="hidden print:block h-16 sm:h-20 ml-auto w-16 sm:w-20"><img src={schoolStamp} alt="School Stamp" className="w-full h-full object-contain" /></div>
                  )}
                  <ErrorMsg field="schoolStamp" />
                  <div className="mt-1">
                    <span className="font-bold italic text-emerald-800 text-[11px]">Next Term Begins:</span>
                    <Input type="date" value={reportData.nextTermBegins}
                      onChange={(e) => setReportData({ ...reportData, nextTermBegins: e.target.value })}
                      className="h-7 text-xs no-print" />
                    <span className="hidden print:inline ml-2">{reportData.nextTermBegins}</span>
                  </div>
                  <p className="text-[10px] italic text-emerald-700 border-t border-emerald-700 pt-1">Head Teacher's Name and Signature</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      <BackConfirmDialog
        open={showBackConfirm}
        onOpenChange={setShowBackConfirm}
        onConfirm={() => navigate(backPath)}
      />
    </div>
  );
};

export default NurseryExamResultTemplate;