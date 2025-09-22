import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Trophy, AlertCircle, Target } from "lucide-react";

interface ClassPerformanceDashboardProps {
  onNavigate: (page: string) => void;
}

const ClassPerformanceDashboard = ({ onNavigate }: ClassPerformanceDashboardProps) => {
  const [selectedClass, setSelectedClass] = useState("JSS 1A");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("First Term");

  // Sample data for visualization
  const performanceData = [
    { range: "90-100", students: 8, label: "Excellent (A)" },
    { range: "80-89", students: 12, label: "Very Good (B+)" },
    { range: "70-79", students: 15, label: "Good (B)" },
    { range: "60-69", students: 8, label: "Credit (C)" },
    { range: "50-59", students: 3, label: "Pass (D)" },
    { range: "0-49", students: 2, label: "Fail (F)" }
  ];

  const subjectPassFailData = [
    { subject: "Mathematics", passed: 38, failed: 7, total: 45 },
    { subject: "English", passed: 42, failed: 3, total: 45 },
    { subject: "Science", passed: 35, failed: 10, total: 45 },
    { subject: "Social Studies", passed: 40, failed: 5, total: 45 },
    { subject: "Computer Science", passed: 44, failed: 1, total: 45 }
  ];

  const termProgressData = [
    { term: "First Term", highest: 95, average: 72.8, lowest: 35, student: 78 },
    { term: "Second Term", highest: 97, average: 75.2, lowest: 42, student: 82 },
    { term: "Third Term", highest: 98, average: 78.1, lowest: 45, student: 85 }
  ];

  const pieChartData = [
    { name: 'Passed', value: 85, color: '#22c55e' },
    { name: 'Failed', value: 15, color: '#ef4444' }
  ];

  const classStats = {
    totalStudents: 45,
    averageScore: 72.8,
    highestScore: 95,
    lowestScore: 35,
    passRate: 84.4,
    attendanceRate: 92.1
  };

  const topPerformers = [
    { name: "Jane Smith", score: 95, subjects: 6 },
    { name: "Mike Johnson", score: 92, subjects: 6 },
    { name: "Sarah Wilson", score: 89, subjects: 6 },
    { name: "David Brown", score: 87, subjects: 6 },
    { name: "Lisa Davis", score: 85, subjects: 6 }
  ];

  const strugglingStudents = [
    { name: "Tom Wilson", score: 35, subjects: 6, needsAttention: true },
    { name: "Emma Jones", score: 42, subjects: 6, needsAttention: true },
    { name: "James Miller", score: 48, subjects: 6, needsAttention: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Class Performance Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and insights for class performance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('entry')}>
                Result Entry
              </Button>
              <Button variant="outline" onClick={() => onNavigate('report')}>
                Student Reports
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Term</label>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{classStats.totalStudents}</div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{classStats.averageScore}%</div>
              <p className="text-sm text-muted-foreground">Class Average</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{classStats.highestScore}%</div>
              <p className="text-sm text-muted-foreground">Highest Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{classStats.lowestScore}%</div>
              <p className="text-sm text-muted-foreground">Lowest Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{classStats.passRate}%</div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold">{classStats.attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>
              Number of students in each performance range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pass/Fail Ratio Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Pass/Fail Ratio</CardTitle>
            <CardDescription>
              Class performance summary for {selectedTerm}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Passed (85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Failed (15%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>
            Pass/fail statistics for each subject
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectPassFailData.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{subject.subject}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Passed: {subject.passed}
                    </Badge>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      Failed: {subject.failed}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Pass Rate: {((subject.passed / subject.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(subject.passed / subject.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Across Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Across Terms</CardTitle>
          <CardDescription>
            Class performance trends throughout the academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={termProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="highest" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Highest Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Class Average"
                />
                <Line 
                  type="monotone" 
                  dataKey="lowest" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Lowest Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers and Students Needing Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Students with highest overall performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((student, index) => (
                <div key={student.name} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.subjects} subjects</p>
                    </div>
                  </div>
                  <Badge variant="default">{student.score}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Students Needing Attention
            </CardTitle>
            <CardDescription>
              Students who may need additional support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strugglingStudents.map((student) => (
                <div key={student.name} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.subjects} subjects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{student.score}%</Badge>
                    {student.needsAttention && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassPerformanceDashboard;