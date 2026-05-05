import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Printer, Save, Send, Plus, Trash2, Edit2, Check, X, MoreVertical, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

// Alphabet-only sanitizer (Task D)
const onlyAlpha = (v: string) => v.replace(/[^A-Za-z\s'.-]/g, "");

type Rating = "ALWAYS" | "SOMETIMES" | "JUST BEGINNING" | "NOT YET" | "";

interface Skill {
  id: string;
  name: string;
  rating: Rating;
}

interface SkillCategory {
  id: string;
  title: string;
  skills: Skill[];
}

const defaultCategories: SkillCategory[] = [
  {
    id: "comm",
    title: "COMMUNICATION, LANGUAGE AND LITERACY",
    skills: [
      { id: "c1", name: "I can say A - Z", rating: "" },
      { id: "c2", name: "I know the vowel letters", rating: "" },
      { id: "c3", name: "I know the consonant letters", rating: "" },
      { id: "c4", name: "I can say my rhymes", rating: "" },
      { id: "c5", name: "I can read simple sentences", rating: "" },
      { id: "c6", name: "I can copy correctly", rating: "" },
      { id: "c7", name: "I can play with friends", rating: "" },
    ],
  },
  {
    id: "math",
    title: "MATHEMATICAL DEVELOPMENT",
    skills: [
      { id: "m1", name: "I can count 1 - 200", rating: "" },
      { id: "m2", name: "I can identify numbers from 1 - 150", rating: "" },
      { id: "m3", name: "I can write numbers 1-150", rating: "" },
    ],
  },
  {
    id: "creative",
    title: "CREATIVE DEVELOPMENT",
    skills: [
      { id: "cr1", name: "I can colour", rating: "" },
      { id: "cr2", name: "I know the primary colours", rating: "" },
      { id: "cr3", name: "I know the secondary colours", rating: "" },
      { id: "cr4", name: "I can identify two letter words", rating: "" },
      { id: "cr5", name: "I can identify three letter words", rating: "" },
      { id: "cr6", name: "I can read two letter words", rating: "" },
      { id: "cr7", name: "I can write independently", rating: "" },
      { id: "cr8", name: "I obey instructions", rating: "" },
    ],
  },
];

const RATING_OPTIONS: Rating[] = ["ALWAYS", "SOMETIMES", "JUST BEGINNING", "NOT YET"];

const NurseryMidtermReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [classTeacherSignature, setClassTeacherSignature] = useState<string | null>(null);
  const [schoolStamp, setSchoolStamp] = useState<string | null>(null);

  const [reportData, setReportData] = useState({
    pupilName: "",
    gender: "",
    academicYear: searchParams.get("session") || "",
    term: searchParams.get("term") || "",
    numberInClass: "",
    grade: searchParams.get("grade") || "Nursery One",
  });

  const [attendance, setAttendance] = useState({
    schoolOpened: searchParams.get("totalOpened") || "",
    sportsOpened: "",
    otherActivities: ["", "", ""],
    schoolPresent: "",
    sportsPresent: "",
    schoolAbsent: "",
    sportsAbsent: "",
  });

  const [categories, setCategories] = useState<SkillCategory[]>(defaultCategories);
  const [classTeacherComment, setClassTeacherComment] = useState("");
  const [headTeacherComment, setHeadTeacherComment] = useState("");
  const [classTeacherName, setClassTeacherName] = useState("");
  const [headTeacherName, setHeadTeacherName] = useState("");
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Auto-calculate absent
  useEffect(() => {
    const opened = parseInt(attendance.schoolOpened) || 0;
    const present = parseInt(attendance.schoolPresent) || 0;
    setAttendance(prev => ({ ...prev, schoolAbsent: String(Math.max(0, opened - present)) }));
  }, [attendance.schoolOpened, attendance.schoolPresent]);

  // Load draft if editing
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) loadDraft(editId);
  }, []);

  // Input sanitizers
  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
  // Allow only alphabets and spaces (no digits or special signs).
  const onlyAlpha = (v: string) => v.replace(/[^A-Za-z\s]/g, "");
  // Academic year: digits and at most one '/'
  const sanitizeAcademicYear = (v: string) => {
    const cleaned = v.replace(/[^0-9/]/g, "");
    const firstSlash = cleaned.indexOf("/");
    if (firstSlash === -1) return cleaned;
    return cleaned.slice(0, firstSlash + 1) + cleaned.slice(firstSlash + 1).replace(/\//g, "");
  };
  const isValidAcademicYear = (v: string) => /^\d{4}\/\d{4}$/.test(v.trim());

  const loadDraft = async (id: string) => {
    const { data, error } = await supabase.from("report_cards").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast.error("Failed to load draft"); return; }
    setReportData({
      pupilName: data.student_name || "",
      gender: data.gender || "",
      academicYear: data.academic_session || "",
      term: data.term || "",
      numberInClass: "",
      grade: data.class_level || "Nursery One",
    });
    setClassTeacherComment(data.class_teacher_comments || "");
    setHeadTeacherComment(data.head_teacher_comments || "");
    setClassTeacherName(data.class_teacher_name || "");
    setHeadTeacherName(data.head_teacher_name || "");
    if (data.passport_photo_url) setPassportPhoto(data.passport_photo_url);
    if (data.total_school_opened) setAttendance(prev => ({ ...prev, schoolOpened: String(data.total_school_opened) }));
    if (data.times_present) setAttendance(prev => ({ ...prev, schoolPresent: String(data.times_present) }));
    if (data.times_absent) setAttendance(prev => ({ ...prev, schoolAbsent: String(data.times_absent) }));
    // Load skills from other_activities JSON if stored
    if (data.other_activities && Array.isArray(data.other_activities)) {
      setAttendance(prev => ({
        ...prev,
        otherActivities: [
          (data.other_activities as string[])[0] || "",
          (data.other_activities as string[])[1] || "",
          (data.other_activities as string[])[2] || "",
        ],
      }));
    }
  };

  const handleFileUpload = (setter: (v: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateRating = (categoryId: string, skillId: string, rating: Rating) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, skills: cat.skills.map(s => s.id === skillId ? { ...s, rating } : s) }
        : cat
    ));
  };

  const addSkill = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, skills: [...cat.skills, { id: `skill-${Date.now()}`, name: "New skill", rating: "" }] }
        : cat
    ));
  };

  const deleteSkill = (categoryId: string, skillId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, skills: cat.skills.filter(s => s.id !== skillId) } : cat
    ));
  };

  const startEditSkill = (skillId: string, currentName: string) => {
    setEditingSkill(skillId);
    setEditingSkillName(currentName);
  };

  const saveEditSkill = (categoryId: string) => {
    if (!editingSkillName.trim()) return;
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, skills: cat.skills.map(s => s.id === editingSkill ? { ...s, name: editingSkillName } : s) }
        : cat
    ));
    setEditingSkill(null);
    setEditingSkillName("");
  };

  // Validation
  const validate = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!reportData.pupilName.trim()) errors.pupilName = "Student name is required";
    if (!reportData.gender) errors.gender = "Gender is required";
    if (!reportData.term) errors.term = "Term is required";
    if (!reportData.academicYear.trim()) errors.academicYear = "Academic year is required";
    else if (!isValidAcademicYear(reportData.academicYear)) errors.academicYear = "Format must be YYYY/YYYY";
    if (reportData.numberInClass && !/^\d+$/.test(reportData.numberInClass)) errors.numberInClass = "Numbers only";
    if (!headTeacherName.trim()) errors.headTeacherName = "Head Teacher name is required";
    if (!headTeacherComment.trim()) errors.headTeacherComment = "Head Teacher comment is required";
    if (!classTeacherComment.trim()) errors.classTeacherComment = "Class Teacher comment is required";
    if (!classTeacherSignature) errors.classTeacherSignature = "Class Teacher signature is required";
    if (!schoolStamp) errors.schoolStamp = "School stamp is required";
    return errors;
  }, [reportData, headTeacherName, headTeacherComment, classTeacherComment, classTeacherSignature, schoolStamp]);

  const isFormValid = Object.keys(validate()).length === 0;

  const buildPayload = () => ({
    student_name: reportData.pupilName.trim(),
    admission_no: "",
    gender: reportData.gender,
    class_level: reportData.grade,
    academic_session: reportData.academicYear.trim(),
    term: reportData.term,
    total_school_opened: parseInt(attendance.schoolOpened) || 0,
    times_present: parseInt(attendance.schoolPresent) || 0,
    times_absent: parseInt(attendance.schoolAbsent) || 0,
    passport_photo_url: passportPhoto,
    class_teacher_comments: classTeacherComment,
    head_teacher_comments: headTeacherComment,
    class_teacher_name: classTeacherName,
    head_teacher_name: headTeacherName,
    other_activities: attendance.otherActivities.filter(Boolean),
    school_sports: [attendance.sportsOpened, attendance.sportsPresent, attendance.sportsAbsent].filter(Boolean),
    conduct_rating: "Good",
    conduct_percentage: 100,
    total_obtainable_score: 0,
    total_score_obtained: 0,
    average_score: 0,
    percentage: 0,
    created_by: user?.id,
  });

  const handleSaveDraft = async () => {
    if (!user) { toast.error("Not authenticated"); return; }
    setIsSavingDraft(true);
    try {
      const editId = searchParams.get("edit");
      const payload = buildPayload();

      if (editId) {
        const { error } = await supabase.from("report_cards").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("report_cards").insert({ ...payload, student_id: user.id });
        if (error) throw error;
      }
      toast.success("Draft saved successfully!");
      navigate("/teacher/draft-results");
    } catch (error: any) {
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields before submitting");
      return;
    }
    setValidationErrors({});
    if (!user) { toast.error("Not authenticated"); return; }

    setIsSubmitting(true);
    try {
      const editId = searchParams.get("edit");
      const payload = buildPayload();

      if (editId) {
        const { error } = await supabase.from("report_cards").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("report_cards").insert({ ...payload, student_id: user.id });
        if (error) throw error;
      }

      const { data: teacherProfile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
      await supabase.from("result_upload_notifications").insert({
        teacher_id: user.id,
        teacher_name: teacherProfile?.name || "Unknown Teacher",
        class_name: reportData.grade,
        student_name: reportData.pupilName,
        result_type: "Nursery Mid-Term",
        submitted_at: new Date().toISOString(),
      });

      toast.success("Nursery Mid-Term report submitted successfully!");
      navigate("/reports");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => window.print();

  const ErrorMsg = ({ field }: { field: string }) =>
    validationErrors[field] ? <p className="text-red-500 text-[10px] mt-0.5">{validationErrors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        /* Decorative footer images — anchored inside the report body */
        .report-footer-deco {
          position: relative;
          width: 100%;
          height: 70px;
          margin-top: 8px;
          pointer-events: none;
        }
        .report-footer-deco img {
          position: absolute;
          bottom: 0;
          height: 60px;
          width: auto;
          object-contain: contain;
        }
        .footer-deco-left { left: 6px; transform: rotate(-25deg); transform-origin: bottom left; }
        .footer-deco-right { right: 6px; }

        /* Inline decorative images */
        .deco-boys-pencil {
          height: 70px;
          width: auto;
          transform: rotate(-25deg);
          transform-origin: bottom center;
          pointer-events: none;
        }
        .deco-abc-blocks {
          height: 56px;
          width: auto;
          pointer-events: none;
        }

        /* Single-line contact info — never wrap */
        .contact-line { white-space: nowrap; overflow: visible; }

        .skill-row .skill-actions { opacity: 0; transition: opacity 0.2s ease; }
        .skill-row:hover .skill-actions { opacity: 1; }

        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
          html, body { width: 210mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { font-size: 8.5pt !important; max-width: 100% !important; padding: 0 !important; }
          .print-container table { font-size: 8pt !important; }
          .deco-boys-pencil { height: 18mm !important; }
          .deco-abc-blocks { height: 18mm !important; }
          .contact-line { white-space: nowrap !important; font-size: 7pt !important; }
        }

        @media (max-width: 640px) {
          .report-footer-deco { height: 50px; }
          .report-footer-deco img { height: 44px; }
          .contact-line { font-size: 7px; }
        }
      `}</style>

      {/* Top bar */}
      <header className="bg-gradient-hero text-white py-4 px-4 sm:px-6 shadow-medium no-print fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setShowBackConfirm(true)}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold truncate">Nursery Mid-Term Report</h1>
          </div>
          {/* Desktop buttons */}
          <div className="hidden sm:flex gap-2">
            <Button onClick={handlePrint} variant="secondary"><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button onClick={handleSaveDraft} variant="outline" className="text-white border-white hover:bg-white/20" disabled={isSavingDraft}>
              <Save className="h-4 w-4 mr-2" />{isSavingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !isFormValid} title={!isFormValid ? "Fill all required fields" : ""}>
              <Send className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
          {/* Mobile 3-dot menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20"><MoreVertical className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveDraft} disabled={isSavingDraft}>
                  <Save className="h-4 w-4 mr-2" />{isSavingDraft ? "Saving..." : "Save Draft"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSubmit} disabled={isSubmitting || !isFormValid}>
                  <Send className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="pt-20 sm:pt-24" />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 print-container">
        <Card className="shadow-lg print:shadow-none print:border-2 print:border-blue-800 border-2 border-blue-700 relative overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-0">

            {/* ===== HEADER SECTION (3-zone, images horizontal & touching cloud) ===== */}
            <div className="border-b-2 border-blue-700 pb-2">
              <div
                className="grid items-center gap-1"
                style={{ gridTemplateColumns: "auto 1fr auto" }}
              >
                {/* LEFT: Coat of arms + title block, with Mickey horizontally beside, touching cloud */}
                <div className="flex items-center gap-0" style={{ marginRight: -24, zIndex: 20, position: "relative" }}>
                  <div className="flex flex-col items-center">
                    <img src={coatOfArmsImg} alt="Nigeria Coat of Arms" className="object-contain" style={{ height: 56, width: 56 }} />
                    <p className="text-red-600 font-extrabold uppercase tracking-wider text-[8px] sm:text-[10px] leading-tight mt-0.5 whitespace-nowrap text-center">TERMLY VOLUME</p>
                    <p className="text-black font-extrabold uppercase text-[6px] sm:text-[8px] leading-tight whitespace-nowrap text-center">CONTINUOUS ASSESSMENT REPORT</p>
                  </div>
                  <img src={mickeyImg} alt="Mickey Mouse" className="object-contain" style={{ height: 88, width: "auto", marginLeft: -4 }} />
                </div>

                {/* CENTER: Cloud background (fixed width on desktop) + School logo + name + contact */}
                <div className="relative flex items-center justify-center min-h-[130px] sm:min-h-[160px] mx-auto sm:w-[460px]">
                  <img
                    src={cloudImg}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full object-fill w-full sm:w-[460px]"
                    style={{ opacity: 0.7, zIndex: 1 }}
                  />
                  <div className="relative text-center px-2 py-1" style={{ zIndex: 10 }}>
                    <img src={schoolLogoImg} alt="Priscilla School" className="mx-auto object-contain" style={{ height: 80, width: 80 }} />
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-800 tracking-wide leading-tight">PRISCILLA SCHOOL</h1>
                    <p className="text-[9px] sm:text-xs text-blue-700 leading-tight">59 Oscar Ibru Way, (Formerly Marine Road) G.R.A. Apapa, Lagos</p>
                    <p className="contact-line text-[9px] sm:text-xs leading-tight">
                      <span className="text-red-600 font-semibold">Tel:</span>{" "}
                      <span className="text-blue-700">+234 803 302 1210, +234 701 987 6174</span>
                      <span className="mx-1">|</span>
                      <span className="text-red-600 font-semibold">Email:</span>{" "}
                      <span className="text-blue-700">priscillaschool@gmail.com</span>
                    </p>
                  </div>
                </div>

                {/* RIGHT: Children-on-books HORIZONTAL touching cloud, then passport box */}
                <div className="flex items-center gap-1" style={{ marginLeft: -24, zIndex: 20, position: "relative" }}>
                  <img src={childrenOnBooksImg} alt="Children on books" className="object-contain" style={{ height: 104, width: "auto", marginRight: -4 }} />
                  <div className="border-2 border-blue-700 bg-blue-50 flex items-center justify-center overflow-hidden" style={{ width: 64, height: 80 }}>
                    {passportPhoto ? (
                      <div className="relative w-full h-full group">
                        <img src={passportPhoto} alt="Student" className="w-full h-full object-cover" />
                        <input id="nursery-photo-replace" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setPassportPhoto)} />
                        <label
                          htmlFor="nursery-photo-replace"
                          className="absolute inset-0 bg-black/60 text-white text-[8px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer no-print transition-opacity"
                        >
                          <Upload className="h-3 w-3 mb-0.5" />
                          Replace
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="nursery-photo" className="text-[7px] text-center cursor-pointer text-blue-600 no-print p-0.5">
                        <Upload className="h-3 w-3 mx-auto mb-0.5" />Upload Photo
                      </label>
                    )}
                    <input id="nursery-photo" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setPassportPhoto)} />
                  </div>
                </div>
              </div>

              {/* Centered report subtitle */}
              <h2 className="text-center text-base sm:text-xl font-bold text-blue-900 mt-2">
                MID-TERM REPORT FOR {reportData.grade?.toUpperCase() || "NURSERY"}
              </h2>
            </div>

            {/* STUDENT INFORMATION TABLE */}
            <div className="border-2 border-blue-700 text-xs sm:text-sm">
              <div className="grid grid-cols-2 border-b border-blue-700">
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Pupil's Name:</span>
                  <Input value={reportData.pupilName} onChange={(e) => setReportData({ ...reportData, pupilName: onlyAlpha(e.target.value) })}
                    className={`h-7 text-xs mt-0.5 no-print ${validationErrors.pupilName ? 'border-red-500' : ''}`} placeholder="Letters only" />
                  <span className="hidden print:inline ml-2">{reportData.pupilName}</span>
                  <ErrorMsg field="pupilName" />
                </div>
                <div className="p-1 sm:p-2">
                  <span className="font-bold italic text-blue-800">Gender:</span>
                  <div className="no-print mt-0.5">
                    <Select value={reportData.gender} onValueChange={(v) => setReportData({ ...reportData, gender: v })}>
                      <SelectTrigger className={`h-7 text-xs ${validationErrors.gender ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="hidden print:inline ml-2">{reportData.gender}</span>
                  <ErrorMsg field="gender" />
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-blue-700">
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Academic Year:</span>
                  <Input value={reportData.academicYear} onChange={(e) => setReportData({ ...reportData, academicYear: sanitizeAcademicYear(e.target.value) })}
                    placeholder="YYYY/YYYY" maxLength={9} inputMode="numeric"
                    className={`h-7 text-xs mt-0.5 no-print ${validationErrors.academicYear ? 'border-red-500' : ''}`} />
                  <span className="hidden print:inline ml-2">{reportData.academicYear}</span>
                  <ErrorMsg field="academicYear" />
                </div>
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Term:</span>
                  <div className="no-print mt-0.5">
                    <Select value={reportData.term} onValueChange={(v) => setReportData({ ...reportData, term: v })}>
                      <SelectTrigger className={`h-7 text-xs ${validationErrors.term ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
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
                  <span className="font-bold italic text-blue-800">Number in Class:</span>
                  <Input value={reportData.numberInClass} onChange={(e) => setReportData({ ...reportData, numberInClass: onlyDigits(e.target.value) })}
                    inputMode="numeric" pattern="[0-9]*"
                    className={`h-7 text-xs mt-0.5 no-print ${validationErrors.numberInClass ? 'border-red-500' : ''}`} />
                  <span className="hidden print:inline ml-2">{reportData.numberInClass}</span>
                  <ErrorMsg field="numberInClass" />
                </div>
              </div>
            </div>

            {/* ATTENDANCE SECTION */}
            <div className="border-2 border-blue-700 border-t-0">
              <div className="bg-blue-100 text-center font-bold text-xs sm:text-sm p-1 border-b border-blue-700 text-blue-900">
                1 ATTENDANCE (Regularity &amp; Punctuality)
              </div>
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-blue-700 p-1 text-left w-2/5"></th>
                    <th className="border border-blue-700 p-1 text-center font-bold text-blue-800">School</th>
                    <th className="border border-blue-700 p-1 text-center font-bold text-blue-800">Sports</th>
                    <th className="border border-blue-700 p-1 text-center font-bold text-blue-800">Other Organized Activities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-blue-700 p-1 font-semibold text-blue-800">Total Time School Opened/Activities Held</td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input inputMode="numeric" pattern="[0-9]*" value={attendance.schoolOpened} onChange={(e) => setAttendance({ ...attendance, schoolOpened: onlyDigits(e.target.value) })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolOpened}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.sportsOpened} onChange={(e) => setAttendance({ ...attendance, sportsOpened: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Football" />
                      <span className="hidden print:inline">{attendance.sportsOpened}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.otherActivities[0]} onChange={(e) => { const a = [...attendance.otherActivities]; a[0] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Open Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[0]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-blue-700 p-1 font-semibold text-blue-800">No. of Time Present:</td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input inputMode="numeric" pattern="[0-9]*" value={attendance.schoolPresent} onChange={(e) => setAttendance({ ...attendance, schoolPresent: onlyDigits(e.target.value) })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolPresent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.sportsPresent} onChange={(e) => setAttendance({ ...attendance, sportsPresent: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Athletics" />
                      <span className="hidden print:inline">{attendance.sportsPresent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.otherActivities[1]} onChange={(e) => { const a = [...attendance.otherActivities]; a[1] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Friendship Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[1]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-blue-700 p-1 font-semibold text-blue-800">No. of Time Absent:</td>
                    <td className="border border-blue-700 p-1 text-center"><span>{attendance.schoolAbsent}</span></td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.sportsAbsent} onChange={(e) => setAttendance({ ...attendance, sportsAbsent: onlyAlpha(e.target.value) })} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Swimming" />
                      <span className="hidden print:inline">{attendance.sportsAbsent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input pattern="[A-Za-z\s]*" value={attendance.otherActivities[2]} onChange={(e) => { const a = [...attendance.otherActivities]; a[2] = onlyAlpha(e.target.value); setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Maths Exhibition" />
                      <span className="hidden print:inline">{attendance.otherActivities[2]}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RESULT ANALYSIS */}
            <div className="border-2 border-blue-700 border-t-0">
              <div className="bg-blue-100 text-center font-bold text-xs sm:text-sm p-1 border-b border-blue-700 text-blue-900">
                RESULT ANALYSIS
              </div>

              {categories.map((category) => (
                <div key={category.id}>
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-blue-700 p-1 text-left bg-blue-200 text-blue-900 font-bold italic w-2/5">{category.title}</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">ALWAYS</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">SOMETIMES</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">JUST BEGINNING</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">NOT YET</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.skills.map((skill) => (
                        <tr key={skill.id} className="skill-row">
                          <td className="border border-blue-700 p-1 text-blue-700">
                            {editingSkill === skill.id ? (
                              <div className="flex items-center gap-1 no-print">
                                <Input value={editingSkillName} onChange={(e) => setEditingSkillName(e.target.value)}
                                  className="h-6 text-xs flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEditSkill(category.id)} />
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => saveEditSkill(category.id)}>
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingSkill(null)}>
                                  <X className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>{skill.name}</span>
                                <div className="skill-actions flex gap-0.5 no-print">
                                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => startEditSkill(skill.id, skill.name)}>
                                    <Edit2 className="h-3 w-3 text-blue-500" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => deleteSkill(category.id, skill.id)}>
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </td>
                          {RATING_OPTIONS.map((rating) => (
                            <td key={rating} className="border border-blue-700 p-1 text-center cursor-pointer hover:bg-blue-50"
                              onClick={() => updateRating(category.id, skill.id, rating)}>
                              {skill.rating === rating && <span className="text-blue-800 font-bold text-sm">✓</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="no-print border-l-2 border-r-2 border-blue-700 px-2 py-1">
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => addSkill(category.id)}>
                      <Plus className="h-3 w-3 mr-1" />Add Skill
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* COMMENTS SECTION */}
            <div className="border-2 border-blue-700 border-t-0 text-xs sm:text-sm">
              <div className="border-b border-blue-700 p-2">
                <span className="font-bold italic text-blue-800">Class Teacher's Comment:</span>
                <Textarea value={classTeacherComment} onChange={(e) => setClassTeacherComment(e.target.value)} rows={2}
                  className={`mt-1 text-xs no-print ${validationErrors.classTeacherComment ? 'border-red-500' : ''}`} placeholder="Enter comment..." />
                <span className="hidden print:inline text-blue-600 ml-2 italic">{classTeacherComment}</span>
                <ErrorMsg field="classTeacherComment" />
              </div>
              <div className="p-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold italic text-blue-800">Head Teacher's Comment:</span>
                    <Textarea value={headTeacherComment} onChange={(e) => setHeadTeacherComment(e.target.value)} rows={2}
                      className={`mt-1 text-xs no-print ${validationErrors.headTeacherComment ? 'border-red-500' : ''}`} placeholder="Enter comment..." />
                    <span className="hidden print:inline text-blue-600 ml-2 italic">{headTeacherComment}</span>
                    <ErrorMsg field="headTeacherComment" />
                  </div>
                  <img src={abcBlocksImg} alt="" aria-hidden="true" className="deco-abc-blocks shrink-0" />
                </div>
              </div>
            </div>

            {/* SIGNATURE & STAMP SECTION */}
            <div className="border-2 border-blue-700 border-t-0 p-3 text-xs sm:text-sm">
              <div className="flex justify-between items-start gap-4">
                {/* Class Teacher — centered within its own block */}
                <div className="flex-1 space-y-1 flex flex-col items-center text-center relative">
                  {/* Boys-on-pencil — angled above the Class Teacher's Name (left-aligned) */}
                  <img
                    src={boysOnPencilImg}
                    alt=""
                    aria-hidden="true"
                    className="deco-boys-pencil mb-1 self-start"
                  />
                  <Input value={classTeacherName} onChange={(e) => setClassTeacherName(onlyAlpha(e.target.value))}
                    className="h-7 text-xs no-print font-bold text-center" placeholder="Class Teacher's Name" />
                  <span className="hidden print:block font-bold text-blue-800 uppercase">{classTeacherName}</span>
                  {/* Signature upload */}
                  <div className={`w-full h-14 sm:h-16 border-2 border-dashed flex items-center justify-center overflow-hidden no-print ${validationErrors.classTeacherSignature ? 'border-red-500' : 'border-blue-400'}`}>
                    {classTeacherSignature ? (
                      <img src={classTeacherSignature} alt="Signature" className="max-h-full object-contain" />
                    ) : (
                      <label htmlFor="teacher-sig" className="text-[8px] text-blue-500 cursor-pointer flex flex-col items-center">
                        <Upload className="h-3 w-3 mb-0.5" />Upload Signature
                      </label>
                    )}
                    <input id="teacher-sig" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setClassTeacherSignature)} />
                  </div>
                  {classTeacherSignature && (
                    <div className="hidden print:block h-14">
                      <img src={classTeacherSignature} alt="Signature" className="max-h-full object-contain" />
                    </div>
                  )}
                  <ErrorMsg field="classTeacherSignature" />
                  <p className="text-[10px] italic text-blue-700 border-t border-blue-700 pt-1 w-full">Class Teacher's Name and Signature</p>
                </div>

                {/* Head Teacher + Stamp + ABC blocks above stamp */}
                <div className="flex-1 text-right space-y-1 relative">
                  <Input value={headTeacherName} onChange={(e) => setHeadTeacherName(onlyAlpha(e.target.value))}
                    className={`h-7 text-xs no-print font-bold text-right ${validationErrors.headTeacherName ? 'border-red-500' : ''}`} placeholder="Head Teacher's Name" />
                  <span className="hidden print:block font-bold text-blue-800 uppercase">{headTeacherName}</span>
                  <ErrorMsg field="headTeacherName" />
                  {/* Stamp upload */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed ml-auto flex items-center justify-center overflow-hidden no-print ${validationErrors.schoolStamp ? 'border-red-500' : 'border-blue-400'}`}>
                    {schoolStamp ? (
                      <img src={schoolStamp} alt="School Stamp" className="w-full h-full object-contain" />
                    ) : (
                      <label htmlFor="school-stamp" className="text-[7px] text-blue-500 cursor-pointer flex flex-col items-center">
                        <Upload className="h-3 w-3 mb-0.5" />Stamp
                      </label>
                    )}
                    <input id="school-stamp" type="file" className="hidden" accept="image/*" onChange={handleFileUpload(setSchoolStamp)} />
                  </div>
                  {schoolStamp && (
                    <div className="hidden print:block h-16 sm:h-20 ml-auto w-16 sm:w-20">
                      <img src={schoolStamp} alt="School Stamp" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <ErrorMsg field="schoolStamp" />
                  <p className="text-[10px] italic text-blue-700 border-t border-blue-700 pt-1">Head Teacher's Name and Signature</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
      <BackConfirmDialog
        open={showBackConfirm}
        onOpenChange={setShowBackConfirm}
        onConfirm={() => navigate('/teacher/upload-result')}
      />
    </div>
  );
};

export default NurseryMidtermReport;
