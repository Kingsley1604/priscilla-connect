import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Send, Edit, Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  caScore: number;
  examScore: number;
  total: number;
  grade: string;
  remark: string;
}

interface ResultEntryProps {
  onNavigate: (page: string) => void;
}

const ResultEntry = ({ onNavigate }: ResultEntryProps) => {
  const [classInfo, setClassInfo] = useState({
    className: "JSS 1A",
    term: "First Term",
    session: "2023/2024",
    subject: "Mathematics"
  });

  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      name: "John Doe",
      admissionNo: "PSC/2023/001",
      caScore: 25,
      examScore: 45,
      total: 70,
      grade: "B",
      remark: "Good"
    },
    {
      id: "2", 
      name: "Jane Smith",
      admissionNo: "PSC/2023/002",
      caScore: 30,
      examScore: 52,
      total: 82,
      grade: "A",
      remark: "Excellent"
    },
    {
      id: "3",
      name: "Mike Johnson", 
      admissionNo: "PSC/2023/003",
      caScore: 20,
      examScore: 35,
      total: 55,
      grade: "C",
      remark: "Fair"
    }
  ]);

  const calculateGrade = (total: number): string => {
    if (total >= 80) return 'A';
    if (total >= 70) return 'B'; 
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'F';
  };

  const getRemark = (grade: string): string => {
    switch (grade) {
      case 'A': return 'Excellent';
      case 'B': return 'Good';
      case 'C': return 'Fair';
      case 'D': return 'Pass';
      default: return 'Fail';
    }
  };

  const updateStudentScore = (studentId: string, field: 'caScore' | 'examScore', value: number) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const updatedStudent = { ...student, [field]: value };
        updatedStudent.total = updatedStudent.caScore + updatedStudent.examScore;
        updatedStudent.grade = calculateGrade(updatedStudent.total);
        updatedStudent.remark = getRemark(updatedStudent.grade);
        return updatedStudent;
      }
      return student;
    }));
  };

  const handleSaveDraft = () => {
    toast.success("Results saved as draft");
  };

  const handleSubmitFinal = () => {
    toast.success("Results submitted successfully");
  };

  const handleAddStudent = () => {
    const newStudent: Student = {
      id: Date.now().toString(),
      name: "New Student",
      admissionNo: "PSC/2023/000", 
      caScore: 0,
      examScore: 0,
      total: 0,
      grade: "F",
      remark: "Fail"
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    toast.success("Student removed");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teacher Result Entry
              </CardTitle>
              <CardDescription>
                Enter and manage student results for your class
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('subjects')}>
                Subject Setup
              </Button>
              <Button variant="outline" onClick={() => onNavigate('dashboard')}>
                Performance Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={classInfo.className} onValueChange={(value) => setClassInfo({...classInfo, className: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSS 1A">JSS 1A</SelectItem>
                  <SelectItem value="JSS 1B">JSS 1B</SelectItem>
                  <SelectItem value="JSS 2A">JSS 2A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Term</label>
              <Select value={classInfo.term} onValueChange={(value) => setClassInfo({...classInfo, term: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Term">First Term</SelectItem>
                  <SelectItem value="Second Term">Second Term</SelectItem>
                  <SelectItem value="Third Term">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Session</label>
              <Select value={classInfo.session} onValueChange={(value) => setClassInfo({...classInfo, session: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Select value={classInfo.subject} onValueChange={(value) => setClassInfo({...classInfo, subject: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                Enter CA and Exam scores for {classInfo.className} - {classInfo.subject}
              </CardDescription>
            </div>
            <Button onClick={handleAddStudent} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>CA (40)</TableHead>
                  <TableHead>Exam (60)</TableHead>
                  <TableHead>Total (100)</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.admissionNo}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={student.caScore}
                        onChange={(e) => updateStudentScore(student.id, 'caScore', Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        value={student.examScore}
                        onChange={(e) => updateStudentScore(student.id, 'examScore', Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {student.total}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={student.grade === 'A' ? 'default' : student.grade === 'F' ? 'destructive' : 'secondary'}
                      >
                        {student.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.remark}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleSaveDraft}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleSubmitFinal}>
          <Send className="h-4 w-4 mr-2" />
          Submit Final
        </Button>
      </div>
    </div>
  );
};

export default ResultEntry;