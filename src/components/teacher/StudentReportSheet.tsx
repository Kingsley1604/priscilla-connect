import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Printer, User } from "lucide-react";
import { toast } from "sonner";

interface StudentReportSheetProps {
  onNavigate: (page: string) => void;
}

const StudentReportSheet = ({ onNavigate }: StudentReportSheetProps) => {
  const [selectedStudent, setSelectedStudent] = useState("1");
  const [selectedTerm, setSelectedTerm] = useState("First Term");

  const students = [
    { id: "1", name: "John Doe", admissionNo: "PSC/2023/001", class: "JSS 1A" },
    { id: "2", name: "Jane Smith", admissionNo: "PSC/2023/002", class: "JSS 1A" },
    { id: "3", name: "Mike Johnson", admissionNo: "PSC/2023/003", class: "JSS 1A" }
  ];

  const currentStudent = students.find(s => s.id === selectedStudent);

  const subjectResults = [
    { subject: "Mathematics", ca: 25, exam: 45, total: 70, grade: "B", remark: "Good" },
    { subject: "English", ca: 30, exam: 52, total: 82, grade: "A", remark: "Excellent" },
    { subject: "Science", ca: 22, exam: 38, total: 60, grade: "C", remark: "Fair" },
    { subject: "Social St.", ca: 28, exam: 47, total: 75, grade: "B", remark: "Good" },
    { subject: "Computer", ca: 35, exam: 55, total: 90, grade: "A", remark: "Excellent" },
    { subject: "French", ca: 20, exam: 32, total: 52, grade: "D", remark: "Pass" }
  ];

  const classStats = {
    highest: 95,
    lowest: 35,
    average: 72.8,
    totalStudents: 45,
    position: 6
  };

  const attendanceRecord = {
    totalDays: 65,
    present: 62,
    absent: 3,
    percentage: 95.4
  };

  const calculateStats = () => {
    const totalScore = subjectResults.reduce((sum, subject) => sum + subject.total, 0);
    const subjectsPassed = subjectResults.filter(subject => subject.total >= 50).length;
    const average = totalScore / subjectResults.length;
    
    return {
      totalSubjects: subjectResults.length,
      subjectsPassed,
      average: average.toFixed(1),
      totalScore
    };
  };

  const stats = calculateStats();

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <div className="space-y-3 print-container">
      {/* Print Styles - Ultra compact for A4 single page */}
      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-container { font-size: 7pt !important; }
          .print-container .space-y-3 { gap: 1px !important; }
          .print-container table { font-size: 7pt !important; }
          .print-container th, .print-container td { padding: 1px 2px !important; }
          .print-container h1, .print-container h2 { font-size: 9pt !important; margin: 0 !important; }
          .print-container p, .print-container span { font-size: 7pt !important; }
          .print-container [class*="Card"] { box-shadow: none !important; border: 0.5pt solid #ccc !important; margin: 1px 0 !important; }
          .print-container [class*="CardHeader"], .print-container [class*="CardContent"] { padding: 2px 4px !important; }
          .print-container .grid { gap: 2px !important; }
          .print-container .p-3, .print-container .p-4 { padding: 2px !important; }
          .print-container .text-xl, .print-container .text-lg { font-size: 8pt !important; }
        }
      `}</style>

      {/* Header - No Print */}
      <Card className="no-print">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Student Report
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onNavigate('entry')}>
                Result Entry
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id} className="text-xs">
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First Term" className="text-xs">First Term</SelectItem>
                <SelectItem value="Second Term" className="text-xs">Second Term</SelectItem>
                <SelectItem value="Third Term" className="text-xs">Third Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Info - Compact */}
      <Card>
        <CardHeader className="bg-gradient-primary text-white p-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-1 text-white text-sm">
                <User className="h-3 w-3" />
                {currentStudent?.name}
              </CardTitle>
              <CardDescription className="text-white/90 text-xs">
                {currentStudent?.admissionNo} • {currentStudent?.class} • {selectedTerm}
              </CardDescription>
            </div>
            <div className="text-right text-white text-xs">
              <p>Position: {classStats.position}/{classStats.totalStudents}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subject Results - Compact Table */}
      <Card>
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs p-1">Subject</TableHead>
                <TableHead className="text-xs p-1 text-center">CA</TableHead>
                <TableHead className="text-xs p-1 text-center">Exam</TableHead>
                <TableHead className="text-xs p-1 text-center">Total</TableHead>
                <TableHead className="text-xs p-1 text-center">Grade</TableHead>
                <TableHead className="text-xs p-1">Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="text-xs p-1 font-medium">{result.subject}</TableCell>
                  <TableCell className="text-xs p-1 text-center">{result.ca}</TableCell>
                  <TableCell className="text-xs p-1 text-center">{result.exam}</TableCell>
                  <TableCell className="text-xs p-1 text-center font-bold">{result.total}</TableCell>
                  <TableCell className="text-xs p-1 text-center">
                    <Badge variant={result.grade === 'A' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                      {result.grade}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs p-1">{result.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats - Single Row */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-primary">{stats.totalSubjects}</div>
          <p className="text-xs text-muted-foreground">Subjects</p>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-green-600">{stats.subjectsPassed}</div>
          <p className="text-xs text-muted-foreground">Passed</p>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-blue-600">{stats.average}%</div>
          <p className="text-xs text-muted-foreground">Average</p>
        </Card>
        <Card className="p-2 text-center">
          <div className="text-lg font-bold text-purple-600">{attendanceRecord.percentage}%</div>
          <p className="text-xs text-muted-foreground">Attendance</p>
        </Card>
      </div>

      {/* Class Comparison - Compact */}
      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <div className="text-sm font-bold text-green-600">{classStats.highest}</div>
              <p className="text-xs text-green-600">Highest</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
              <div className="text-sm font-bold text-blue-600">{stats.average}</div>
              <p className="text-xs text-blue-600">Student</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
              <div className="text-sm font-bold text-orange-600">{classStats.average}</div>
              <p className="text-xs text-orange-600">Class Avg</p>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
              <div className="text-sm font-bold text-red-600">{classStats.lowest}</div>
              <p className="text-xs text-red-600">Lowest</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options - No Print */}
      <Card className="no-print">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Button onClick={() => toast.success("Downloading PDF...")} className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button onClick={() => toast.success("Downloading Word...")} variant="outline" className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Word
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentReportSheet;