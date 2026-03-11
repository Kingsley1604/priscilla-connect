import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Printer, Save, Upload, Plus, Trash2, Edit2, Check, X, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Asset imports
import coatOfArmsImg from "@/assets/ng-coat-of-arms.jpg";
import schoolLogoImg from "@/assets/priscilla-school-logo.png";
import mickeyImg from "@/assets/mickey.png";
import cloudImg from "@/assets/cloud-img.png";
import childrenOnBooksImg from "@/assets/children-on-books.png";
import abcBlocksImg from "@/assets/abc-blocks.png";
import boysOnPencilImg from "@/assets/boys-on-pencil.png";

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
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);

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

  // Skill editing state
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editingSkillName, setEditingSkillName] = useState("");

  // Auto-calculate absent
  useEffect(() => {
    const opened = parseInt(attendance.schoolOpened) || 0;
    const present = parseInt(attendance.schoolPresent) || 0;
    setAttendance(prev => ({ ...prev, schoolAbsent: String(Math.max(0, opened - present)) }));
  }, [attendance.schoolOpened, attendance.schoolPresent]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error("Image must be < 2MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setPassportPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateRating = (categoryId: string, skillId: string, rating: Rating) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, skills: cat.skills.map(s => (s.id === skillId ? { ...s, rating } : s)) }
          : cat
      )
    );
  };

  const addSkill = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, skills: [...cat.skills, { id: `skill-${Date.now()}`, name: "New skill", rating: "" }] }
          : cat
      )
    );
  };

  const deleteSkill = (categoryId: string, skillId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, skills: cat.skills.filter(s => s.id !== skillId) } : cat
      )
    );
  };

  const startEditSkill = (skillId: string, currentName: string) => {
    setEditingSkill(skillId);
    setEditingSkillName(currentName);
  };

  const saveEditSkill = (categoryId: string) => {
    if (!editingSkillName.trim()) return;
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, skills: cat.skills.map(s => (s.id === editingSkill ? { ...s, name: editingSkillName } : s)) }
          : cat
      )
    );
    setEditingSkill(null);
    setEditingSkillName("");
  };

  const handleSubmit = async () => {
    if (!reportData.pupilName) { toast.error("Please enter pupil's name"); return; }
    if (!user) { toast.error("Not authenticated"); return; }

    setIsSubmitting(true);
    try {
      // Store as report_card with nursery midterm type
      const skillsData = categories.map(cat => ({
        category: cat.title,
        skills: cat.skills.map(s => ({ name: s.name, rating: s.rating })),
      }));

      const { error } = await supabase.from("report_cards").insert({
        student_id: user.id,
        student_name: reportData.pupilName,
        admission_no: "",
        gender: reportData.gender,
        class_level: reportData.grade,
        academic_session: reportData.academicYear,
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
        created_by: user.id,
      });

      if (error) throw error;

      // Notify admins
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
      console.error("Error:", error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { font-size: 9pt !important; }
          .print-container table { font-size: 8pt !important; }
        }
        .check-mark::after { content: "✓"; font-size: 16px; font-weight: bold; }
      `}</style>

      {/* Top bar - hidden on print */}
      <header className="bg-gradient-hero text-white py-4 px-4 sm:px-6 shadow-medium no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => navigate("/teacher/upload-result")}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold truncate">Nursery Mid-Term Report</h1>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button onClick={handlePrint} variant="secondary"><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20"><MoreVertical className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />{isSubmitting ? "Submitting..." : "Submit"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 print-container">
        <Card className="shadow-lg print:shadow-none print:border-2 print:border-blue-800 border-2 border-blue-700">
          <CardContent className="p-4 sm:p-6 space-y-0">

            {/* ===== HEADER SECTION ===== */}
            <div className="border-b-2 border-blue-700 pb-2">
              {/* Three-zone header */}
              <div className="flex items-start justify-between gap-2">
                {/* LEFT ZONE */}
                <div className="flex flex-col items-center gap-1 w-20 sm:w-24 flex-shrink-0">
                  <img src={coatOfArmsImg} alt="Nigeria Coat of Arms" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
                  <img src={mickeyImg} alt="Mickey Mouse" className="h-10 w-14 sm:h-12 sm:w-16 object-contain" />
                </div>

                {/* CENTER ZONE */}
                <div className="flex-1 text-center relative">
                  <div className="relative inline-block w-full">
                    <img src={cloudImg} alt="" className="mx-auto h-14 sm:h-20 object-contain opacity-30 absolute inset-0 w-full" />
                    <div className="relative z-10 py-1">
                      <img src={schoolLogoImg} alt="Priscilla School" className="mx-auto h-10 w-10 sm:h-14 sm:w-14 object-contain" />
                      <h1 className="text-lg sm:text-2xl font-bold text-blue-800 tracking-wide">PRISCILLA SCHOOL</h1>
                      <p className="text-[10px] sm:text-xs text-blue-700">59 Oscar Ibru Way, (Formerly Marine Road) G.R.A. Apapa, Lagos</p>
                      <p className="text-[10px] sm:text-xs">
                        <span className="text-red-600 font-semibold">Tel:</span>{" "}
                        <span className="text-blue-700">+234 803 302 1210, +234 701 987 6174.</span>{" "}
                        <span className="text-red-600 font-semibold">Email: priscillaschool@gmail.com</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT ZONE */}
                <div className="flex flex-col items-center gap-1 w-20 sm:w-24 flex-shrink-0">
                  <img src={childrenOnBooksImg} alt="Children on books" className="h-12 w-14 sm:h-16 sm:w-18 object-contain" />
                  {/* Passport photo */}
                  <div className="w-14 h-16 sm:w-16 sm:h-20 border-2 border-blue-700 bg-blue-50 flex items-center justify-center overflow-hidden">
                    {passportPhoto ? (
                      <img src={passportPhoto} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <label htmlFor="nursery-photo" className="text-[8px] text-center cursor-pointer text-blue-600 no-print p-1">
                        Upload Photo
                      </label>
                    )}
                    <input id="nursery-photo" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                </div>
              </div>
            </div>

            {/* REPORT TITLE */}
            <div className="text-center py-2 border-b-2 border-blue-700">
              <div className="flex items-center justify-center gap-4 text-xs sm:text-sm">
                <span className="text-red-600 font-bold">TERMLY VOLUME</span>
              </div>
              <p className="text-[10px] sm:text-xs text-blue-700">CONTINUOUS ASSESSMENT REPORT</p>
              <h2 className="text-base sm:text-xl font-bold text-blue-900 mt-1">
                MID-TERM REPORT FOR {reportData.grade?.toUpperCase() || "NURSERY"}
              </h2>
            </div>

            {/* STUDENT INFORMATION TABLE */}
            <div className="border-2 border-blue-700 text-xs sm:text-sm">
              <div className="grid grid-cols-2 border-b border-blue-700">
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Pupil's Name:</span>
                  <Input value={reportData.pupilName} onChange={(e) => setReportData({ ...reportData, pupilName: e.target.value })} className="h-7 text-xs mt-0.5 no-print" />
                  <span className="hidden print:inline ml-2">{reportData.pupilName}</span>
                </div>
                <div className="p-1 sm:p-2">
                  <span className="font-bold italic text-blue-800">Gender:</span>
                  <Input value={reportData.gender} onChange={(e) => setReportData({ ...reportData, gender: e.target.value })} className="h-7 text-xs mt-0.5 no-print" placeholder="Male / Female" />
                  <span className="hidden print:inline ml-2">{reportData.gender}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-blue-700">
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Year:</span>
                  <Input value={reportData.academicYear} onChange={(e) => setReportData({ ...reportData, academicYear: e.target.value })} className="h-7 text-xs mt-0.5 no-print" />
                  <span className="hidden print:inline ml-2">{reportData.academicYear}</span>
                </div>
                <div className="p-1 sm:p-2 border-r border-blue-700">
                  <span className="font-bold italic text-blue-800">Term:</span>
                  <Input value={reportData.term} readOnly className="h-7 text-xs mt-0.5 bg-muted" />
                  <span className="hidden print:inline ml-2">{reportData.term}</span>
                </div>
                <div className="p-1 sm:p-2">
                  <span className="font-bold italic text-blue-800">Number in Class:</span>
                  <Input value={reportData.numberInClass} onChange={(e) => setReportData({ ...reportData, numberInClass: e.target.value })} className="h-7 text-xs mt-0.5 no-print" />
                  <span className="hidden print:inline ml-2">{reportData.numberInClass}</span>
                </div>
              </div>
            </div>

            {/* ATTENDANCE SECTION */}
            <div className="border-2 border-blue-700 border-t-0">
              <div className="bg-blue-100 text-center font-bold text-xs sm:text-sm p-1 border-b border-blue-700 text-blue-900">
                1 ATTENDANCE (Regularity & Punctuality)
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
                      <Input value={attendance.schoolOpened} onChange={(e) => setAttendance({ ...attendance, schoolOpened: e.target.value })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolOpened}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.sportsOpened} onChange={(e) => setAttendance({ ...attendance, sportsOpened: e.target.value })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.sportsOpened}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.otherActivities[0]} onChange={(e) => { const a = [...attendance.otherActivities]; a[0] = e.target.value; setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Children's Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[0]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-blue-700 p-1 font-semibold text-blue-800">No. of Time Present:</td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.schoolPresent} onChange={(e) => setAttendance({ ...attendance, schoolPresent: e.target.value })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.schoolPresent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.sportsPresent} onChange={(e) => setAttendance({ ...attendance, sportsPresent: e.target.value })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.sportsPresent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.otherActivities[1]} onChange={(e) => { const a = [...attendance.otherActivities]; a[1] = e.target.value; setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Colour Day" />
                      <span className="hidden print:inline">{attendance.otherActivities[1]}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-blue-700 p-1 font-semibold text-blue-800">No. of Time Absent:</td>
                    <td className="border border-blue-700 p-1 text-center">
                      <span>{attendance.schoolAbsent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.sportsAbsent} onChange={(e) => setAttendance({ ...attendance, sportsAbsent: e.target.value })} className="h-6 text-xs text-center no-print w-full" />
                      <span className="hidden print:inline">{attendance.sportsAbsent}</span>
                    </td>
                    <td className="border border-blue-700 p-1 text-center">
                      <Input value={attendance.otherActivities[2]} onChange={(e) => { const a = [...attendance.otherActivities]; a[2] = e.target.value; setAttendance({ ...attendance, otherActivities: a }); }} className="h-6 text-xs text-center no-print w-full" placeholder="e.g. Maths Exhibition" />
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
                  {/* Category header */}
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-blue-700 p-1 text-left bg-blue-200 text-blue-900 font-bold italic w-2/5">
                          {category.title}
                        </th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">ALWAYS</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">SOMETIMES</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">JUST BEGINNING</th>
                        <th className="border border-blue-700 p-1 text-center bg-blue-200 text-blue-900 font-bold w-[15%]">NOT YET</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.skills.map((skill) => (
                        <tr key={skill.id}>
                          <td className="border border-blue-700 p-1 text-blue-700">
                            {editingSkill === skill.id ? (
                              <div className="flex items-center gap-1 no-print">
                                <Input
                                  value={editingSkillName}
                                  onChange={(e) => setEditingSkillName(e.target.value)}
                                  className="h-6 text-xs flex-1"
                                  autoFocus
                                />
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
                                <div className="flex gap-0.5 no-print">
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
                            <td
                              key={rating}
                              className="border border-blue-700 p-1 text-center cursor-pointer hover:bg-blue-50"
                              onClick={() => updateRating(category.id, skill.id, rating)}
                            >
                              {skill.rating === rating && <span className="text-blue-800 font-bold text-sm">✓</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Add skill button */}
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
                <Textarea value={classTeacherComment} onChange={(e) => setClassTeacherComment(e.target.value)} rows={2} className="mt-1 text-xs no-print" placeholder="Enter comment..." />
                <span className="hidden print:inline text-blue-600 ml-2">{classTeacherComment}</span>
              </div>
              <div className="p-2">
                <span className="font-bold italic text-blue-800">Head Teacher's Comment:</span>
                <Textarea value={headTeacherComment} onChange={(e) => setHeadTeacherComment(e.target.value)} rows={2} className="mt-1 text-xs no-print" placeholder="Enter comment..." />
                <span className="hidden print:inline text-blue-600 ml-2">{headTeacherComment}</span>
              </div>
            </div>

            {/* SIGNATURE SECTION */}
            <div className="border-2 border-blue-700 border-t-0 p-2 text-xs sm:text-sm">
              <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                  <Input value={classTeacherName} onChange={(e) => setClassTeacherName(e.target.value)} className="h-7 text-xs no-print" placeholder="Class Teacher's Name" />
                  <span className="hidden print:block font-bold text-blue-800">{classTeacherName}</span>
                  <div className="border-t border-blue-700 mt-8 pt-1">
                    <p className="text-[10px] italic text-blue-700">Class Teacher's Name and Signature</p>
                  </div>
                </div>
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-blue-400 flex items-center justify-center">
                  <span className="text-[8px] text-blue-400 no-print">Stamp</span>
                </div>
                <div className="flex-1 text-right">
                  <Input value={headTeacherName} onChange={(e) => setHeadTeacherName(e.target.value)} className="h-7 text-xs no-print" placeholder="Head Teacher's Name" />
                  <span className="hidden print:block font-bold text-blue-800">{headTeacherName}</span>
                  <div className="border-t border-blue-700 mt-8 pt-1">
                    <p className="text-[10px] italic text-blue-700">Head Teacher's Name and Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM DECORATIVE IMAGES */}
            <div className="flex justify-between items-end pt-2">
              <img src={boysOnPencilImg} alt="Boys on pencil" className="h-10 sm:h-14 object-contain" />
              <img src={abcBlocksImg} alt="ABC blocks" className="h-10 sm:h-14 object-contain" />
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NurseryMidtermReport;
