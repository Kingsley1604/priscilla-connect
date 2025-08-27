import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, Eye, Users, Trophy, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ExamResult {
  id: string;
  score: number;
  percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  attempt_id: string;
  student_id: string;
  exam_id: string;
  exam_attempts: {
    token_number: string;
    submitted_at: string;
    answers: Record<string, string>;
    total_questions: number;
  };
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt';
    duration_minutes: number;
  };
}

interface ExamToken {
  id: string;
  token_number: string;
  student_id: string | null;
  used_at: string | null;
  created_at: string;
  exam_id: string;
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt';
  };
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  token_number: string;
  submitted_at: string;
  total_questions: number;
  exams: {
    title: string;
    exam_type: 'entrance' | 'cbt';
  };
}

const ExamResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [tokens, setTokens] = useState<ExamToken[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'tokens' | 'attempts'>('results');
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [examsList, setExamsList] = useState<Array<{id: string, title: string, exam_type: string}>>([]);

  // Token creation form
  const [newToken, setNewToken] = useState({
    exam_id: "",
    token_number: "",
    count: 1
  });

  useEffect(() => {
    loadData();
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("id, title, exam_type")
        .eq("status", "active");

      if (error) throw error;
      setExamsList(data || []);
    } catch (error) {
      console.error("Error loading exams:", error);
    }
  };

  const loadData = async () => {
    try {
      // Load results
      const { data: resultsData, error: resultsError } = await supabase
        .from("exam_results")
        .select(`
          *,
          exam_attempts!inner (
            token_number,
            submitted_at,
            answers,
            total_questions
          ),
          exams!inner (
            title,
            exam_type,
            duration_minutes
          )
        `)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;
      setResults((resultsData || []).map(result => ({
        ...result,
        exam_attempts: {
          ...result.exam_attempts,
          answers: result.exam_attempts.answers as Record<string, string>
        }
      })));

      // Load tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from("exam_tokens")
        .select(`
          *,
          exams!inner (
            title,
            exam_type
          )
        `)
        .order("created_at", { ascending: false });

      if (tokensError) throw tokensError;
      setTokens(tokensData || []);

      // Load recent attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select(`
          *,
          exams!inner (
            title,
            exam_type
          )
        `)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(50);

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData || []);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const createTokens = async () => {
    if (!newToken.exam_id || !newToken.token_number.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const tokens = [];
      for (let i = 0; i < newToken.count; i++) {
        const tokenNumber = newToken.count === 1 
          ? newToken.token_number 
          : `${newToken.token_number}-${(i + 1).toString().padStart(3, '0')}`;
        
        tokens.push({
          exam_id: newToken.exam_id,
          token_number: tokenNumber,
          created_by: user.user.id
        });
      }

      const { error } = await supabase
        .from("exam_tokens")
        .insert(tokens);

      if (error) throw error;

      toast.success(`${newToken.count} token(s) created successfully!`);
      setIsCreateTokenOpen(false);
      setNewToken({ exam_id: "", token_number: "", count: 1 });
      loadData();
    } catch (error) {
      console.error("Error creating tokens:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Token number already exists");
      } else {
        toast.error("Failed to create tokens");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateScore = async (result: ExamResult) => {
    try {
      // Get questions and answers
      const { data: questions, error } = await supabase
        .from("exam_questions")
        .select("id, correct_answer")
        .eq("exam_id", result.exam_id);

      if (error) throw error;

      let correctCount = 0;
      const answers = result.exam_attempts.answers;

      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          correctCount++;
        }
      });

      const percentage = (correctCount / questions.length) * 100;

      return {
        score: correctCount,
        totalQuestions: questions.length,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error("Error calculating score:", error);
      return null;
    }
  };

  const approveResult = async (resultId: string, action: 'approved' | 'rejected') => {
    try {
      const result = results.find(r => r.id === resultId);
      if (!result) return;

      let updateData: any = {
        status: action,
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (action === 'approved' && result.score === 0) {
        // Calculate actual score
        const scoreData = await calculateScore(result);
        if (scoreData) {
          updateData.score = scoreData.score;
          updateData.percentage = scoreData.percentage;
        }
      }

      const { error } = await supabase
        .from("exam_results")
        .update(updateData)
        .eq("id", resultId);

      if (error) throw error;

      toast.success(`Result ${action} successfully!`);
      loadData();
    } catch (error) {
      console.error("Error updating result:", error);
      toast.error("Failed to update result");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const pendingResults = results.filter(r => r.status === 'pending');
  const approvedResults = results.filter(r => r.status === 'approved');
  const totalAttempts = attempts.length;
  const totalTokens = tokens.length;
  const usedTokens = tokens.filter(t => t.used_at).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Exam Management</h1>
          </div>
          
          <Dialog open={isCreateTokenOpen} onOpenChange={setIsCreateTokenOpen}>
            <DialogTrigger asChild>
              <Button>Create Exam Tokens</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Exam Tokens</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="exam">Select Exam</Label>
                  <select 
                    id="exam"
                    value={newToken.exam_id}
                    onChange={(e) => setNewToken(prev => ({ ...prev, exam_id: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select an exam...</option>
                    {examsList.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.exam_type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="token_number">Base Token Number</Label>
                  <Input
                    id="token_number"
                    value={newToken.token_number}
                    onChange={(e) => setNewToken(prev => ({ ...prev, token_number: e.target.value }))}
                    placeholder="e.g., ENT2024"
                  />
                </div>

                <div>
                  <Label htmlFor="count">Number of Tokens</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={newToken.count}
                    onChange={(e) => setNewToken(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <Button onClick={createTokens} disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : `Create ${newToken.count} Token(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Results</p>
                  <p className="text-2xl font-bold">{pendingResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved Results</p>
                  <p className="text-2xl font-bold">{approvedResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                  <p className="text-2xl font-bold">{totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Used Tokens</p>
                  <p className="text-2xl font-bold">{usedTokens}/{totalTokens}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'results', label: 'Results' },
            { key: 'tokens', label: 'Tokens' },
            { key: 'attempts', label: 'Attempts' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Results Tab */}
        {activeTab === 'results' && (
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{result.exams.title}</h4>
                          <Badge variant={result.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                            {result.exams.exam_type.toUpperCase()}
                          </Badge>
                          {getStatusBadge(result.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Token:</span> {result.exam_attempts.token_number}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {formatDate(result.exam_attempts.submitted_at)}
                          </div>
                          <div>
                            <span className="font-medium">Score:</span> {result.score}/{result.exam_attempts.total_questions}
                          </div>
                          <div>
                            <span className="font-medium">Percentage:</span> {result.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Exam Attempt Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Exam:</strong> {result.exams.title}</div>
                                <div><strong>Token:</strong> {result.exam_attempts.token_number}</div>
                                <div><strong>Type:</strong> {result.exams.exam_type.toUpperCase()}</div>
                                <div><strong>Duration:</strong> {result.exams.duration_minutes} minutes</div>
                                <div><strong>Score:</strong> {result.score}/{result.exam_attempts.total_questions}</div>
                                <div><strong>Percentage:</strong> {result.percentage.toFixed(1)}%</div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Student Answers:</h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                  {Object.entries(result.exam_attempts.answers).map(([questionId, answer], index) => (
                                    <div key={questionId} className="text-sm p-2 bg-muted rounded">
                                      <strong>Q{index + 1}:</strong> Answer {answer?.toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {result.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveResult(result.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => approveResult(result.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No exam results found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <Card>
            <CardHeader>
              <CardTitle>Exam Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{token.token_number}</span>
                        <Badge variant={token.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                          {token.exams.exam_type.toUpperCase()}
                        </Badge>
                        <Badge variant={token.used_at ? 'destructive' : 'default'}>
                          {token.used_at ? 'Used' : 'Available'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {token.exams.title} • Created {formatDate(token.created_at)}
                        {token.used_at && ` • Used ${formatDate(token.used_at)}`}
                      </div>
                    </div>
                  </div>
                ))}

                {tokens.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tokens created yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attempts Tab */}
        {activeTab === 'attempts' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{attempt.exams.title}</span>
                        <Badge variant={attempt.exams.exam_type === 'entrance' ? 'default' : 'secondary'}>
                          {attempt.exams.exam_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Token: {attempt.token_number} • 
                        Submitted: {formatDate(attempt.submitted_at)} • 
                        {attempt.total_questions} questions
                      </div>
                    </div>
                  </div>
                ))}

                {attempts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No exam attempts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamResults;