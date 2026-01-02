import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, CheckCircle, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class_level: string;
  due_date: string;
  total_marks: number;
  created_at: string;
}

interface Submission {
  id: string;
  homework_id: string;
  submission_text: string;
  file_url: string | null;
  marks_obtained: number | null;
  teacher_feedback: string | null;
  status: string;
  submitted_at: string;
}

const HomeworkSubmission = () => {
  const navigate = useNavigate();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [selectedHomework, setSelectedHomework] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomework();
    fetchSubmissions();
  }, []);

  const fetchHomework = async () => {
    try {
      // First get the student's class
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('class_grade')
        .eq('id', user.id)
        .single();

      const studentClass = profile?.class_grade || '';

      // Fetch only homework for the student's class
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('is_active', true)
        .eq('class_level', studentClass)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setHomework(data || []);
    } catch (error) {
      console.error('Error fetching homework:', error);
      toast.error('Failed to load homework');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      
      const submissionsMap: Record<string, Submission> = {};
      data?.forEach(sub => {
        submissionsMap[sub.homework_id] = sub;
      });
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSubmit = async (homeworkId: string) => {
    if (!submissionText.trim()) {
      toast.error("Please write your answer");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('homework_submissions')
        .insert({
          homework_id: homeworkId,
          student_id: user.id,
          student_name: user.user_metadata?.name || 'Student',
          submission_text: submissionText,
          status: 'submitted'
        });

      if (error) throw error;

      toast.success("Homework submitted successfully!");
      setSubmissionText("");
      setSelectedHomework(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Error submitting homework:', error);
      toast.error('Failed to submit homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (hw: Homework) => {
    const submission = submissions[hw.id];
    if (submission) {
      if (submission.status === 'graded') {
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Graded: {submission.marks_obtained}/{hw.total_marks}</Badge>;
      }
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
    }
    const isOverdue = new Date(hw.due_date) < new Date();
    return isOverdue ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="outline">Pending</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            Homework Submissions
          </h1>
          <p className="text-muted-foreground mt-2">
            View and submit your homework assignments
          </p>
        </div>

        {homework.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No homework assignments available at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {homework.map((hw) => {
              const submission = submissions[hw.id];
              return (
                <Card key={hw.id} className="shadow-medium">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{hw.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{hw.subject}</Badge>
                          <Badge variant="outline">{hw.class_level}</Badge>
                          {getStatusBadge(hw)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Due: {format(new Date(hw.due_date), 'MMM dd, yyyy')}</div>
                        <div className="font-semibold mt-1">Total: {hw.total_marks} marks</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{hw.description}</p>

                    {submission ? (
                      <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Your Submission:</Label>
                          <p className="mt-1 text-sm">{submission.submission_text}</p>
                        </div>
                        {submission.teacher_feedback && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Teacher Feedback:</Label>
                            <p className="mt-1 text-sm text-primary">{submission.teacher_feedback}</p>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Submitted on {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedHomework === hw.id ? (
                          <div className="space-y-4 border-t pt-4">
                            <div>
                              <Label>Your Answer</Label>
                              <Textarea
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Write your homework answer here..."
                                className="mt-2 min-h-[120px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleSubmit(hw.id)}
                                disabled={isSubmitting}
                                className="flex-1"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isSubmitting ? 'Submitting...' : 'Submit Homework'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setSelectedHomework(null);
                                  setSubmissionText("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => setSelectedHomework(hw.id)}
                            className="w-full"
                          >
                            Start Submission
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkSubmission;