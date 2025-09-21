import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, FileText, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const UploadResult = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [resultData, setResultData] = useState({
    studentId: "",
    studentName: "",
    examType: "",
    subject: "",
    score: "",
    totalMarks: "",
    grade: "",
    comments: "",
    examDate: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setResultData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculatePercentage = () => {
    if (resultData.score && resultData.totalMarks) {
      return ((parseInt(resultData.score) / parseInt(resultData.totalMarks)) * 100).toFixed(1);
    }
    return "0";
  };

  const handleUploadResult = async () => {
    // Validate required fields
    if (!resultData.studentId || !resultData.studentName || !resultData.examType || 
        !resultData.score || !resultData.totalMarks) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);

    try {
      const percentage = parseFloat(calculatePercentage());
      
      // Create exam result entry
      const { error } = await supabase
        .from('exam_results')
        .insert({
          attempt_id: `manual-attempt-${Date.now()}`, // Generate a manual attempt ID
          student_id: resultData.studentId,
          exam_id: `manual-${Date.now()}`, // Generate a manual exam ID
          score: parseInt(resultData.score),
          percentage: percentage,
          status: 'approved' // Teacher uploaded results are pre-approved
        });

      if (error) throw error;

      toast.success('Result uploaded successfully!');
      
      // Navigate based on exam type
      if (resultData.examType === 'Exam Result') {
        navigate('/reports/exam-result');
      } else if (resultData.examType === 'Midterm Result') {
        navigate('/reports/midterm-result');
      } else {
        navigate('/reports');
      }

    } catch (error) {
      console.error('Error uploading result:', error);
      toast.error('Failed to upload result');
    } finally {
      setIsUploading(false);
    }
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const currentPercentage = parseFloat(calculatePercentage());
  const suggestedGrade = getGradeFromPercentage(currentPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload Student Result
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Upload and manage student exam results
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Student Result Information
            </CardTitle>
            <CardDescription>
              Enter the student's exam details and scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID *</Label>
                <Input
                  id="student-id"
                  value={resultData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  placeholder="Enter student ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name *</Label>
                <Input
                  id="student-name"
                  value={resultData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  placeholder="Enter student name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-type">Exam Type *</Label>
                <Select 
                  value={resultData.examType} 
                  onValueChange={(value) => handleInputChange('examType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrance Result">Entrance Result</SelectItem>
                    <SelectItem value="Midterm Result">Midterm Result</SelectItem>
                    <SelectItem value="Exam Result">Exam Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={resultData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score Obtained *</Label>
                <Input
                  id="score"
                  type="number"
                  value={resultData.score}
                  onChange={(e) => handleInputChange('score', e.target.value)}
                  placeholder="Enter score"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-marks">Total Marks *</Label>
                <Input
                  id="total-marks"
                  type="number"
                  value={resultData.totalMarks}
                  onChange={(e) => handleInputChange('totalMarks', e.target.value)}
                  placeholder="Enter total marks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-date">Exam Date</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={resultData.examDate}
                  onChange={(e) => handleInputChange('examDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={resultData.grade || suggestedGrade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder={`Suggested: ${suggestedGrade}`}
                />
              </div>
            </div>

            {/* Performance Summary */}
            {resultData.score && resultData.totalMarks && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {resultData.score}/{resultData.totalMarks}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Score</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {calculatePercentage()}%
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Percentage</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {suggestedGrade}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Suggested Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={resultData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Enter any additional comments about the student's performance..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Link to="/reports">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button 
                onClick={handleUploadResult} 
                disabled={isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Upload Result
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadResult;