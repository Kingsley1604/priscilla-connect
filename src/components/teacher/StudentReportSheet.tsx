import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Printer, TrendingUp, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    { subject: "Mathematics", ca: 25, exam: 45, total: 70, grade: "B", remark: "Good", position: 5 },
    { subject: "English Language", ca: 30, exam: 52, total: 82, grade: "A", remark: "Excellent", position: 2 },
    { subject: "Basic Science", ca: 22, exam: 38, total: 60, grade: "C", remark: "Fair", position: 8 },
    { subject: "Social Studies", ca: 28, exam: 47, total: 75, grade: "B", remark: "Good", position: 4 },
    { subject: "Computer Science", ca: 35, exam: 55, total: 90, grade: "A", remark: "Excellent", position: 1 },
    { subject: "French Language", ca: 20, exam: 32, total: 52, grade: "D", remark: "Pass", position: 12 }
  ];

  const performanceData = [
    { term: "First Term", average: 71.5 },
    { term: "Second Term", average: 75.2 },
    { term: "Third Term", average: 78.8 }
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

  const handleDownloadPDF = () => {
    toast.success("Downloading report as PDF...");
  };

  const handleDownloadWord = () => {
    toast.success("Downloading report as Word document...");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Student Report Sheet
              </CardTitle>
              <CardDescription>
                View and download comprehensive student performance reports
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('entry')}>
                Result Entry
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Select Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.admissionNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Select Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
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
          </div>
        </CardContent>
      </Card>

      {/* Student Information */}
      <Card>
        <CardHeader className="bg-gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                {currentStudent?.name}
              </CardTitle>
              <CardDescription className="text-white/90">
                {currentStudent?.admissionNo} • {currentStudent?.class} • {selectedTerm} 2023/2024
              </CardDescription>
            </div>
            <div className="text-right text-white">
              <p className="text-sm">Teacher: Mrs. Sarah Johnson</p>
              <p className="text-sm">Class Position: {classStats.position} of {classStats.totalStudents}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subject Results */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>
            Detailed breakdown of performance across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>CA (40)</TableHead>
                  <TableHead>Exam (60)</TableHead>
                  <TableHead>Total (100)</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{result.subject}</TableCell>
                    <TableCell>{result.ca}</TableCell>
                    <TableCell>{result.exam}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {result.total}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={result.grade === 'A' ? 'default' : result.grade === 'F' ? 'destructive' : 'secondary'}
                      >
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.remark}</TableCell>
                    <TableCell>{result.position}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalSubjects}</div>
              <p className="text-sm text-muted-foreground">Subjects Taken</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.subjectsPassed}</div>
              <p className="text-sm text-muted-foreground">Subjects Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.average}%</div>
              <p className="text-sm text-muted-foreground">Overall Average</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{attendanceRecord.percentage}%</div>
              <p className="text-sm text-muted-foreground">Attendance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Class Performance Comparison
          </CardTitle>
          <CardDescription>
            Student performance compared to class statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-lg font-bold text-green-600">{classStats.highest}</div>
              <p className="text-sm text-green-600">Class Highest</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.average}</div>
              <p className="text-sm text-blue-600">Student Average</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{classStats.average}</div>
              <p className="text-sm text-orange-600">Class Average</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-lg font-bold text-red-600">{classStats.lowest}</div>
              <p className="text-sm text-red-600">Class Lowest</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Across Terms</CardTitle>
          <CardDescription>
            Student progress throughout the academic session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Record */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">{attendanceRecord.totalDays}</div>
              <p className="text-sm text-muted-foreground">Total School Days</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{attendanceRecord.present}</div>
              <p className="text-sm text-muted-foreground">Days Present</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{attendanceRecord.absent}</div>
              <p className="text-sm text-muted-foreground">Days Absent</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{attendanceRecord.percentage}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
          <CardDescription>
            Download the report in your preferred format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleDownloadPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download as PDF
            </Button>
            <Button onClick={handleDownloadWord} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download as Word
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentReportSheet;