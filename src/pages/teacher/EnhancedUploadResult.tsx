import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Send, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface StudentResult {
  id: string;
  name: string;
  admissionNo: string;
  halfTermScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

const EnhancedUploadResult = () => {
  const [formData, setFormData] = useState({
    academicSession: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    totalTimeOpened: "",
    resultType: "",
    term: "",
    classLevel: "",
    grade: ""
  });

  const [students, setStudents] = useState<StudentResult[]>([]);

  const gradeRules = [
    { min: 90, max: 100, grade: "A", remark: "EXCELLENT" },
    { min: 80, max: 89, grade: "B", remark: "VERY GOOD" },
    { min: 70, max: 79, grade: "C", remark: "GOOD" },
    { min: 60, max: 69, grade: "D", remark: "AVERAGE" },
    { min: 50, max: 59, grade: "E", remark: "BELOW AVERAGE" },
    { min: 0, max: 49, grade: "F", remark: "FAIL" }
  ];

  const calculateGrade = (total: number) => {
    const rule = gradeRules.find(r => total >= r.min && total <= r.max);
    return rule || { grade: "F", remark: "FAIL" };
  };

  const updateScore = (id: string, field: 'halfTermScore' | 'examScore', value: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        updated.totalScore = updated.halfTermScore + updated.examScore;
        const gradeInfo = calculateGrade(updated.totalScore);
        updated.grade = gradeInfo.grade;
        updated.remark = gradeInfo.remark;
        return updated;
      }
      return s;
    }));
  };

  const addStudent = () => {
    setStudents(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      admissionNo: "",
      halfTermScore: 0,
      examScore: 0,
      totalScore: 0,
      grade: "F",
      remark: "FAIL"
    }]);
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const getGradeOptions = () => {
    const { classLevel } = formData;
    if (classLevel === "Primary") {
      return ["Play Group 1", "Play Group 2", "First Grade", "Second Grade", "Third Grade", "Fourth Grade", "Fifth Grade", "Sixth Grade"];
    } else if (classLevel === "Junior Secondary") {
      return ["Seventh Grade", "Eighth Grade", "Nineth Grade"];
    } else if (classLevel === "Senior Secondary") {
      return ["Tenth Grade", "Eleventh Grade", "Twelfth Grade"];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Upload Result</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Result Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Academic Session</Label>
                <Input 
                  value={formData.academicSession} 
                  onChange={(e) => setFormData({...formData, academicSession: e.target.value})}
                  placeholder="e.g., 2024/2025"
                />
              </div>
              <div>
                <Label>Total Time School Opened</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 180 days"
                  value={formData.totalTimeOpened}
                  onChange={(e) => setFormData({...formData, totalTimeOpened: e.target.value})}
                />
              </div>
              <div>
                <Label>Result Type</Label>
                <Select value={formData.resultType} onValueChange={(v) => setFormData({...formData, resultType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MidTerm Result">MidTerm Result</SelectItem>
                    <SelectItem value="Examination Result">Examination Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
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
                <Label>Class Level</Label>
                <Select value={formData.classLevel} onValueChange={(v) => setFormData({...formData, classLevel: v, grade: ""})}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                    <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})} disabled={!formData.classLevel}>
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Student Results - {formData.grade}</CardTitle>
                <Button onClick={addStudent}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Half Term (40)</TableHead>
                    <TableHead>Exam (60)</TableHead>
                    <TableHead>Total (100)</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center">No students added yet</TableCell></TableRow>
                  ) : (
                    students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell><Input value={s.name} onChange={(e) => setStudents(prev => prev.map(st => st.id === s.id ? {...st, name: e.target.value} : st))} /></TableCell>
                        <TableCell><Input value={s.admissionNo} onChange={(e) => setStudents(prev => prev.map(st => st.id === s.id ? {...st, admissionNo: e.target.value} : st))} /></TableCell>
                        <TableCell><Input type="number" max={40} value={s.halfTermScore} onChange={(e) => updateScore(s.id, 'halfTermScore', Number(e.target.value))} /></TableCell>
                        <TableCell><Input type="number" max={60} value={s.examScore} onChange={(e) => updateScore(s.id, 'examScore', Number(e.target.value))} /></TableCell>
                        <TableCell className="font-bold">{s.totalScore}</TableCell>
                        <TableCell>{s.grade}</TableCell>
                        <TableCell>{s.remark}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => removeStudent(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => toast.success("Saved as draft")}><Save className="h-4 w-4 mr-2" />Save Draft</Button>
          <Button onClick={() => {
            toast.success("Creating result...");
            // Navigate to report card system with form data
            window.location.href = `/teacher/report-card?session=${formData.academicSession}&term=${formData.term}&class=${formData.classLevel}&grade=${formData.grade}`;
          }}>
            <Send className="h-4 w-4 mr-2" />
            Create Result
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUploadResult;