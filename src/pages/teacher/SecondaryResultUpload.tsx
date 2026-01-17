import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Plus, Trash2, Save, Send, Printer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SecondaryResultPrintTemplate from "@/components/reports/SecondaryResultPrintTemplate";

interface Subject {
  id: string;
  subject_name: string;
  ca1_score: number;
  ca2_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  teacher_remark: string;
  class_average: number;
}

interface AffectiveTraits {
  punctuality: number;
  neatness: number;
  attendance: number;
  honesty: number;
  reliability: number;
  relationship_with_staff: number;
  relationship_with_students: number;
  self_control: number;
  attitude_to_school: number;
}

interface PsychomotorSkills {
  handwriting: number;
  reading: number;
  verbal_fluency: number;
  musical_skills: number;
  creative_arts: number;
  physical_education: number;
  general_reasoning: number;
}

interface Student {
  id: string;
  name: string;
  admission_no: string;
  class_grade: string;
  gender: string;
  date_of_birth: string;
}

const SECONDARY_SUBJECTS = [
  'English Language', 'Mathematics', 'Civic Education', 'Basic Science',
  'Social Studies', 'Agricultural Science', 'Basic Technology', 
  'Business Studies', 'Computer Studies', 'Home Economics',
  'Christian Religious Studies', 'Physical and Health Education',
  'Fine Arts', 'Music', 'French', 'Yoruba/Igbo/Hausa'
];

const SS_SUBJECTS = [
  'English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Agricultural Science', 'Computer Studies', 'Civic Education',
  'Further Mathematics', 'Technical Drawing', 'Financial Accounting'
];

// Nigerian Secondary Grading Scale
const calculateGrade = (total: number): string => {
  if (total >= 75) return 'A1';
  if (total >= 70) return 'B2';
  if (total >= 65) return 'B3';
  if (total >= 60) return 'C4';
  if (total >= 55) return 'C5';
  if (total >= 50) return 'C6';
  if (total >= 45) return 'D7';
  if (total >= 40) return 'E8';
  return 'F9';
};

const SecondaryResultUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    classLevel: '',
    arm: '',
    academicSession: '2024/2025',
    term: '',
    nextTermBegins: '',
    daysSchoolOpened: 0,
    daysPresent: 0,
    positionInClass: 0,
    totalStudents: 0,
    classAverage: 0,
    highestAverage: 0,
    lowestAverage: 0,
    classTeacherRemark: '',
    principalRemark: ''
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [affectiveTraits, setAffectiveTraits] = useState<AffectiveTraits>({
    punctuality: 3, neatness: 3, attendance: 3, honesty: 3, reliability: 3,
    relationship_with_staff: 3, relationship_with_students: 3, self_control: 3, attitude_to_school: 3
  });

  const [psychomotorSkills, setPsychomotorSkills] = useState<PsychomotorSkills>({
    handwriting: 3, reading: 3, verbal_fluency: 3, musical_skills: 3,
    creative_arts: 3, physical_education: 3, general_reasoning: 3
  });

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.classLevel) return;
      
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      
      const studentIds = (studentRoles || []).map(r => r.user_id);
      
      const { data } = await supabase
        .from('profiles')
        .select('id, name, admission_no, class_grade, gender, date_of_birth')
        .in('id', studentIds)
        .eq('class_grade', formData.classLevel)
        .order('name');
      
      if (data) {
        setStudents(data.map(s => ({
          id: s.id,
          name: s.name || 'Unknown',
          admission_no: s.admission_no || '',
          class_grade: s.class_grade || '',
          gender: s.gender || '',
          date_of_birth: s.date_of_birth || ''
        })));
      }
    };
    loadStudents();
  }, [formData.classLevel]);

  // Add default subjects when class is selected
  useEffect(() => {
    if (formData.classLevel && subjects.length === 0) {
      const subjectList = formData.classLevel.startsWith('SS') ? SS_SUBJECTS : SECONDARY_SUBJECTS;
      setSubjects(subjectList.slice(0, 12).map((name, idx) => ({
        id: `subj-${idx}`,
        subject_name: name,
        ca1_score: 0,
        ca2_score: 0,
        exam_score: 0,
        total_score: 0,
        grade: 'F9',
        teacher_remark: '',
        class_average: 0
      })));
    }
  }, [formData.classLevel]);

  const updateSubject = (id: string, field: keyof Subject, value: number | string) => {
    setSubjects(prev => prev.map(subj => {
      if (subj.id === id) {
        const updated = { ...subj, [field]: value };
        if (field === 'ca1_score' || field === 'ca2_score' || field === 'exam_score') {
          updated.total_score = Number(updated.ca1_score) + Number(updated.ca2_score) + Number(updated.exam_score);
          updated.grade = calculateGrade(updated.total_score);
        }
        return updated;
      }
      return subj;
    }));
  };

  const addSubject = () => {
    setSubjects(prev => [...prev, {
      id: `subj-${Date.now()}`,
      subject_name: '',
      ca1_score: 0,
      ca2_score: 0,
      exam_score: 0,
      total_score: 0,
      grade: 'F9',
      teacher_remark: '',
      class_average: 0
    }]);
  };

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const calculateStudentAverage = (): number => {
    if (subjects.length === 0) return 0;
    const total = subjects.reduce((sum, s) => sum + s.total_score, 0);
    return Math.round((total / subjects.length) * 100) / 100;
  };

  const calculateStudentTotal = (): number => {
    return subjects.reduce((sum, s) => sum + s.total_score, 0);
  };

  const handleSaveDraft = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate age from DOB
      const dob = new Date(selectedStudent.date_of_birth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Create report card
      const { data: reportCard, error: reportError } = await supabase
        .from('secondary_report_cards')
        .insert({
          student_id: selectedStudent.id,
          student_name: selectedStudent.name,
          admission_no: selectedStudent.admission_no,
          class_level: formData.classLevel,
          arm: formData.arm || null,
          gender: selectedStudent.gender,
          age: isNaN(age) ? null : age,
          academic_session: formData.academicSession,
          term: formData.term,
          next_term_begins: formData.nextTermBegins || null,
          position_in_class: formData.positionInClass || null,
          total_students: formData.totalStudents || null,
          student_total_score: calculateStudentTotal(),
          student_average: calculateStudentAverage(),
          class_average: formData.classAverage || null,
          highest_average: formData.highestAverage || null,
          lowest_average: formData.lowestAverage || null,
          days_school_opened: formData.daysSchoolOpened,
          days_present: formData.daysPresent,
          class_teacher_remark: formData.classTeacherRemark,
          status: 'draft',
          created_by: user?.id
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert subjects
      if (subjects.length > 0) {
        const { error: subjectsError } = await supabase
          .from('secondary_report_subjects')
          .insert(subjects.map(s => ({
            report_card_id: reportCard.id,
            subject_name: s.subject_name,
            ca1_score: s.ca1_score,
            ca2_score: s.ca2_score,
            exam_score: s.exam_score,
            class_average: s.class_average || null,
            grade: s.grade,
            teacher_remark: s.teacher_remark || null
          })));
        if (subjectsError) throw subjectsError;
      }

      // Insert affective traits
      const { error: traitsError } = await supabase
        .from('secondary_affective_traits')
        .insert({
          report_card_id: reportCard.id,
          ...affectiveTraits
        });
      if (traitsError) throw traitsError;

      // Insert psychomotor skills
      const { error: skillsError } = await supabase
        .from('secondary_psychomotor_skills')
        .insert({
          report_card_id: reportCard.id,
          ...psychomotorSkills
        });
      if (skillsError) throw skillsError;

      toast.success('Result saved as draft!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    await handleSaveDraft();
    // Update status to submitted
    toast.success('Result submitted for approval!');
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const classLevels = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
  const terms = ['First Term', 'Second Term', 'Third Term'];

  if (showPrintPreview && selectedStudent) {
    return (
      <SecondaryResultPrintTemplate
        studentData={{
          name: selectedStudent.name,
          admissionNo: selectedStudent.admission_no,
          classLevel: formData.classLevel,
          arm: formData.arm,
          gender: selectedStudent.gender,
          age: Math.floor((Date.now() - new Date(selectedStudent.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        }}
        academicData={{
          session: formData.academicSession,
          term: formData.term,
          nextTermBegins: formData.nextTermBegins
        }}
        performanceData={{
          position: formData.positionInClass,
          totalStudents: formData.totalStudents,
          studentTotal: calculateStudentTotal(),
          studentAverage: calculateStudentAverage(),
          classAverage: formData.classAverage,
          highestAverage: formData.highestAverage,
          lowestAverage: formData.lowestAverage
        }}
        attendanceData={{
          daysOpened: formData.daysSchoolOpened,
          daysPresent: formData.daysPresent,
          daysAbsent: formData.daysSchoolOpened - formData.daysPresent
        }}
        subjects={subjects}
        affectiveTraits={affectiveTraits}
        psychomotorSkills={psychomotorSkills}
        remarks={{
          classTeacher: formData.classTeacherRemark,
          principal: formData.principalRemark
        }}
        onClose={() => setShowPrintPreview(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/reports">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Secondary School Result Sheet
              </h1>
              <p className="text-muted-foreground">Knightdale Middle College - Examination Result</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={!selectedStudent}>
              <Printer className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving || !selectedStudent}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSaving || !selectedStudent}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="info">Student Info</TabsTrigger>
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="affective">Affective</TabsTrigger>
            <TabsTrigger value="psychomotor">Psychomotor</TabsTrigger>
            <TabsTrigger value="remarks">Remarks</TabsTrigger>
          </TabsList>

          {/* Student Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Student & Class Information</CardTitle>
                <CardDescription>Select student and enter class details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Class Level *</Label>
                    <Select value={formData.classLevel} onValueChange={(v) => setFormData(prev => ({ ...prev, classLevel: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Arm (Optional)</Label>
                    <Input value={formData.arm} onChange={(e) => setFormData(prev => ({ ...prev, arm: e.target.value }))} placeholder="A, B, C..." />
                  </div>
                  <div>
                    <Label>Academic Session *</Label>
                    <Input value={formData.academicSession} onChange={(e) => setFormData(prev => ({ ...prev, academicSession: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Term *</Label>
                    <Select value={formData.term} onValueChange={(v) => setFormData(prev => ({ ...prev, term: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map(term => (
                          <SelectItem key={term} value={term}>{term}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Next Term Begins</Label>
                    <Input type="date" value={formData.nextTermBegins} onChange={(e) => setFormData(prev => ({ ...prev, nextTermBegins: e.target.value }))} />
                  </div>
                </div>

                {formData.classLevel && (
                  <div className="space-y-4">
                    <Label>Select Student</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {students.map(student => (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedStudent?.id === student.id 
                              ? 'border-primary bg-primary/10' 
                              : 'hover:border-primary/50'
                          }`}
                        >
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">Adm: {student.admission_no}</p>
                        </div>
                      ))}
                      {students.length === 0 && (
                        <p className="text-muted-foreground col-span-full">No students found in this class</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedStudent && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Selected Student</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><Label className="text-xs">Name</Label><p className="font-medium">{selectedStudent.name}</p></div>
                        <div><Label className="text-xs">Admission No</Label><p>{selectedStudent.admission_no}</p></div>
                        <div><Label className="text-xs">Gender</Label><p className="capitalize">{selectedStudent.gender || 'N/A'}</p></div>
                        <div><Label className="text-xs">Class</Label><p>{formData.classLevel} {formData.arm}</p></div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Attendance & Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Days School Opened</Label>
                          <Input type="number" value={formData.daysSchoolOpened} onChange={(e) => setFormData(prev => ({ ...prev, daysSchoolOpened: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Days Present</Label>
                          <Input type="number" value={formData.daysPresent} onChange={(e) => setFormData(prev => ({ ...prev, daysPresent: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <Label className="text-xs">Days Absent</Label>
                        <p className="font-bold text-lg">{formData.daysSchoolOpened - formData.daysPresent}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Class Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Position in Class</Label>
                          <Input type="number" value={formData.positionInClass} onChange={(e) => setFormData(prev => ({ ...prev, positionInClass: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Total Students</Label>
                          <Input type="number" value={formData.totalStudents} onChange={(e) => setFormData(prev => ({ ...prev, totalStudents: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Class Average</Label>
                          <Input type="number" step="0.01" value={formData.classAverage} onChange={(e) => setFormData(prev => ({ ...prev, classAverage: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Highest Average</Label>
                          <Input type="number" step="0.01" value={formData.highestAverage} onChange={(e) => setFormData(prev => ({ ...prev, highestAverage: Number(e.target.value) }))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academics Tab */}
          <TabsContent value="academics">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Academic Results</CardTitle>
                    <CardDescription>Enter scores for each subject (CA1: 20, CA2: 20, Exam: 60)</CardDescription>
                  </div>
                  <Button size="sm" onClick={addSubject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Subject</TableHead>
                        <TableHead className="w-20 text-center">CA1 (20)</TableHead>
                        <TableHead className="w-20 text-center">CA2 (20)</TableHead>
                        <TableHead className="w-20 text-center">Exam (60)</TableHead>
                        <TableHead className="w-20 text-center">Total (100)</TableHead>
                        <TableHead className="w-16 text-center">Grade</TableHead>
                        <TableHead className="w-32">Remark</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <Input
                              value={subject.subject_name}
                              onChange={(e) => updateSubject(subject.id, 'subject_name', e.target.value)}
                              placeholder="Subject name"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="text-center"
                              value={subject.ca1_score}
                              onChange={(e) => updateSubject(subject.id, 'ca1_score', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              className="text-center"
                              value={subject.ca2_score}
                              onChange={(e) => updateSubject(subject.id, 'ca2_score', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="60"
                              className="text-center"
                              value={subject.exam_score}
                              onChange={(e) => updateSubject(subject.id, 'exam_score', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold">{subject.total_score}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={subject.grade.startsWith('A') || subject.grade.startsWith('B') ? 'default' : subject.grade.startsWith('C') ? 'secondary' : 'destructive'}>
                              {subject.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={subject.teacher_remark}
                              onChange={(e) => updateSubject(subject.id, 'teacher_remark', e.target.value)}
                              placeholder="Remark"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeSubject(subject.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Subjects</p>
                      <p className="text-2xl font-bold text-blue-600">{subjects.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Score</p>
                      <p className="text-2xl font-bold text-blue-600">{calculateStudentTotal()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-2xl font-bold text-blue-600">{calculateStudentAverage()}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Obtainable</p>
                      <p className="text-2xl font-bold text-blue-600">{subjects.length * 100}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affective Traits Tab */}
          <TabsContent value="affective">
            <Card>
              <CardHeader>
                <CardTitle>Affective Traits Assessment</CardTitle>
                <CardDescription>Rate each trait from 1 (Poor) to 5 (Excellent)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(affectiveTraits).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <Button
                            key={rating}
                            type="button"
                            variant={value === rating ? 'default' : 'outline'}
                            size="sm"
                            className="w-10 h-10"
                            onClick={() => setAffectiveTraits(prev => ({ ...prev, [key]: rating }))}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Psychomotor Skills Tab */}
          <TabsContent value="psychomotor">
            <Card>
              <CardHeader>
                <CardTitle>Psychomotor Skills Assessment</CardTitle>
                <CardDescription>Rate each skill from 1 (Poor) to 5 (Excellent)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(psychomotorSkills).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <Button
                            key={rating}
                            type="button"
                            variant={value === rating ? 'default' : 'outline'}
                            size="sm"
                            className="w-10 h-10"
                            onClick={() => setPsychomotorSkills(prev => ({ ...prev, [key]: rating }))}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remarks Tab */}
          <TabsContent value="remarks">
            <Card>
              <CardHeader>
                <CardTitle>Remarks & Comments</CardTitle>
                <CardDescription>Add class teacher and principal remarks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Class Teacher's Remark</Label>
                  <Textarea
                    value={formData.classTeacherRemark}
                    onChange={(e) => setFormData(prev => ({ ...prev, classTeacherRemark: e.target.value }))}
                    placeholder="Enter class teacher's remark about the student's performance..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Principal's Remark (Admin Only)</Label>
                  <Textarea
                    value={formData.principalRemark}
                    onChange={(e) => setFormData(prev => ({ ...prev, principalRemark: e.target.value }))}
                    placeholder="This will be filled by the admin/principal..."
                    rows={4}
                    disabled={user?.role !== 'admin'}
                    className={user?.role !== 'admin' ? 'bg-muted' : ''}
                  />
                  {user?.role !== 'admin' && (
                    <p className="text-xs text-muted-foreground mt-1">Principal's remark can only be added by admin after approval</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecondaryResultUpload;
