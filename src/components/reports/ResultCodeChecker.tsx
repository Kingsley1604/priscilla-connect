import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, AlertCircle, CheckCircle, Trophy, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  percentage: number;
  status: string;
  created_at: string;
  exam: {
    title: string;
    exam_type: string;
    duration_minutes: number;
  };
}

interface ResultCodeCheckerProps {
  examType: 'entrance' | 'midterm' | 'exam';
  isOpen: boolean;
  onClose: () => void;
}

const ResultCodeChecker = ({ examType, isOpen, onClose }: ResultCodeCheckerProps) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState('');

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Please enter a result code');
      return;
    }

    if (!user) {
      setError('Please log in to check results');
      return;
    }

    setIsChecking(true);
    setError('');
    setResult(null);

    try {
      // First, verify the result code
      const { data: codeData, error: codeError } = await supabase
        .from('result_codes')
        .select('*')
        .eq('code', code)
        .eq('student_id', user.id)
        .eq('exam_type', examType)
        .single();

      if (codeError || !codeData) {
        setError('Invalid result code or code not found for this exam type');
        return;
      }

      if (codeData.is_used) {
        setError('This result code has already been used');
        return;
      }

      // For entrance results, check if user actually took the entrance exam
      if (examType === 'entrance') {
        const { data: entranceAttempt, error: attemptError } = await supabase
          .from('exam_attempts')
          .select(`
            *,
            exams!inner(exam_type)
          `)
          .eq('student_id', user.id)
          .eq('exams.exam_type', 'entrance')
          .not('submitted_at', 'is', null)
          .single();

        if (attemptError || !entranceAttempt) {
          setError('You have not taken the entrance exam. Only students who took the entrance exam can view entrance results.');
          return;
        }
      }

      // Get the exam result with the correct structure
      const { data: resultData, error: resultError } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams!inner(title, exam_type, duration_minutes)
        `)
        .eq('student_id', user.id)
        .eq('status', 'approved')
        .single();

      if (resultError || !resultData) {
        setError('No approved results found. Please contact administration.');
        return;
      }

      // Transform the data to match our interface
      const transformedResult: ExamResult = {
        ...resultData,
        exam: resultData.exams
      };

      // Mark the code as used
      await supabase
        .from('result_codes')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', codeData.id);

      setResult(transformedResult);
      toast.success('Result loaded successfully!');

    } catch (error) {
      console.error('Error checking result code:', error);
      setError('An error occurred while checking the code. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getExamTypeInfo = () => {
    switch (examType) {
      case 'entrance':
        return {
          title: 'Entrance Result',
          icon: Trophy,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
        };
      case 'midterm':
        return {
          title: 'Midterm Result',
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20'
        };
      case 'exam':
        return {
          title: 'Exam Result',
          icon: Brain,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/20'
        };
    }
  };

  const typeInfo = getExamTypeInfo();

  const getGradeInfo = (percentage: number) => {
    if (percentage >= 70) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 50) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <typeInfo.icon className={`h-5 w-5 ${typeInfo.color}`} />
            {typeInfo.title}
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${typeInfo.bgColor}`}>
              <p className="text-sm">
                Enter your result code to view your {examType} result. 
                {examType === 'entrance' && ' Only students who took the entrance exam can view entrance results.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Result Code</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter result code (e.g. ABC123)"
                className="uppercase"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleCheckCode} 
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? 'Checking...' : 'Check Result'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Result successfully retrieved!
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{result.exam?.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {result.exam?.exam_type?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {result.exam?.duration_minutes} minutes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {result.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {result.percentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Percentage
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${getGradeInfo(result.percentage).bgColor} ${getGradeInfo(result.percentage).color}`}>
                    {getGradeInfo(result.percentage).grade}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Grade
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Result Date: {new Date(result.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => {
                setResult(null);
                setCode('');
                setError('');
              }}
              variant="outline"
              className="w-full"
            >
              Check Another Result
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResultCodeChecker;