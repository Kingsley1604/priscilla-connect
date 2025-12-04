import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

type QuestionType = 'multiple-choice' | 'multiple-response' | 'true-false' | 'matching' | 'numeric' | 'fill-blank' | 'short-answer' | 'essay' | 'file-upload';

const CreateQuestions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const examId = params.get('examId');
  const questionType = params.get('type') as QuestionType || 'multiple-choice';

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  // Multiple Choice / Multiple Response state
  const [mcQuestion, setMcQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "a" as string,
    correct_answers: [] as string[] // For multiple response
  });

  // True/False state
  const [tfQuestion, setTfQuestion] = useState({
    question_text: "",
    correct_answer: "true"
  });

  // Matching state
  const [matchingQuestion, setMatchingQuestion] = useState({
    question_text: "",
    pairs: [{ left: "", right: "" }, { left: "", right: "" }]
  });

  // Numeric state
  const [numericQuestion, setNumericQuestion] = useState({
    question_text: "",
    correct_answer: ""
  });

  // Fill in the blank state
  const [fillBlankQuestion, setFillBlankQuestion] = useState({
    question_text: "", // Use ___ for blanks
    correct_answers: [""]
  });

  // Short Answer state
  const [shortQuestion, setShortQuestion] = useState({
    question_text: "",
    sample_answer: ""
  });

  // Essay state
  const [essayQuestion, setEssayQuestion] = useState({
    question_text: "",
    max_words: "500"
  });

  // File Upload state
  const [fileQuestion, setFileQuestion] = useState({
    question_text: "",
    allowed_types: "pdf,doc,docx"
  });

  useEffect(() => {
    if (examId) {
      fetchQuestionCount();
    }
  }, [examId]);

  const fetchQuestionCount = async () => {
    const { count } = await supabase
      .from('exam_questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', examId);
    setQuestionCount(count || 0);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    const labels: Record<QuestionType, string> = {
      'multiple-choice': 'Multiple Choice',
      'multiple-response': 'Multiple Response',
      'true-false': 'True / False',
      'matching': 'Matching / Ordering',
      'numeric': 'Numeric',
      'fill-blank': 'Fill in the Blank',
      'short-answer': 'Short Answer',
      'essay': 'Essay',
      'file-upload': 'File Upload'
    };
    return labels[type] || type;
  };

  const handleSubmit = async () => {
    if (!examId) {
      toast.error("No exam selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: existingQuestions, error: countError } = await supabase
        .from('exam_questions')
        .select('question_order')
        .eq('exam_id', examId)
        .order('question_order', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextOrder = existingQuestions?.length > 0 ? existingQuestions[0].question_order + 1 : 1;

      let questionData: any = {
        exam_id: examId,
        question_order: nextOrder,
      };

      // Build question data based on type
      switch (questionType) {
        case 'multiple-choice':
          if (!mcQuestion.question_text || !mcQuestion.option_a || !mcQuestion.option_b) {
            toast.error("Please fill in question and at least options A and B");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: mcQuestion.question_text,
            option_a: mcQuestion.option_a,
            option_b: mcQuestion.option_b,
            option_c: mcQuestion.option_c || "N/A",
            option_d: mcQuestion.option_d || "N/A",
            correct_answer: mcQuestion.correct_answer
          };
          break;

        case 'multiple-response':
          if (!mcQuestion.question_text || !mcQuestion.option_a || !mcQuestion.option_b || mcQuestion.correct_answers.length === 0) {
            toast.error("Please fill in question, options, and select at least one correct answer");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[MULTI] ${mcQuestion.question_text}`,
            option_a: mcQuestion.option_a,
            option_b: mcQuestion.option_b,
            option_c: mcQuestion.option_c || "N/A",
            option_d: mcQuestion.option_d || "N/A",
            correct_answer: mcQuestion.correct_answers.join(',')
          };
          break;

        case 'true-false':
          if (!tfQuestion.question_text) {
            toast.error("Please enter the question");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[TF] ${tfQuestion.question_text}`,
            option_a: "True",
            option_b: "False",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: tfQuestion.correct_answer === "true" ? "a" : "b"
          };
          break;

        case 'matching':
          if (!matchingQuestion.question_text || matchingQuestion.pairs.some(p => !p.left || !p.right)) {
            toast.error("Please fill in the question and all matching pairs");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[MATCH] ${matchingQuestion.question_text}`,
            option_a: matchingQuestion.pairs.map(p => p.left).join('|'),
            option_b: matchingQuestion.pairs.map(p => p.right).join('|'),
            option_c: "MATCHING",
            option_d: "N/A",
            correct_answer: matchingQuestion.pairs.map((_, i) => i).join(',')
          };
          break;

        case 'numeric':
          if (!numericQuestion.question_text || !numericQuestion.correct_answer) {
            toast.error("Please fill in the question and correct answer");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[NUM] ${numericQuestion.question_text}`,
            option_a: numericQuestion.correct_answer,
            option_b: "NUMERIC",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;

        case 'fill-blank':
          if (!fillBlankQuestion.question_text || fillBlankQuestion.correct_answers.some(a => !a)) {
            toast.error("Please fill in the question and all correct answers");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[FILL] ${fillBlankQuestion.question_text}`,
            option_a: fillBlankQuestion.correct_answers.join('|'),
            option_b: "FILL_BLANK",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;

        case 'short-answer':
          if (!shortQuestion.question_text) {
            toast.error("Please enter the question");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[SHORT] ${shortQuestion.question_text}`,
            option_a: shortQuestion.sample_answer || "Manual grading required",
            option_b: "SHORT_ANSWER",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;

        case 'essay':
          if (!essayQuestion.question_text) {
            toast.error("Please enter the question");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[ESSAY] ${essayQuestion.question_text}`,
            option_a: `Max words: ${essayQuestion.max_words}`,
            option_b: "ESSAY",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;

        case 'file-upload':
          if (!fileQuestion.question_text) {
            toast.error("Please enter the question");
            setIsSubmitting(false);
            return;
          }
          questionData = {
            ...questionData,
            question_text: `[FILE] ${fileQuestion.question_text}`,
            option_a: `Allowed: ${fileQuestion.allowed_types}`,
            option_b: "FILE_UPLOAD",
            option_c: "N/A",
            option_d: "N/A",
            correct_answer: "a"
          };
          break;
      }

      const { error } = await supabase
        .from('exam_questions')
        .insert(questionData);

      if (error) throw error;

      toast.success("Question added successfully!");
      setQuestionCount(prev => prev + 1);
      resetForm();
    } catch (error) {
      toast.error("Failed to add question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMcQuestion({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "a",
      correct_answers: []
    });
    setTfQuestion({ question_text: "", correct_answer: "true" });
    setMatchingQuestion({ question_text: "", pairs: [{ left: "", right: "" }, { left: "", right: "" }] });
    setNumericQuestion({ question_text: "", correct_answer: "" });
    setFillBlankQuestion({ question_text: "", correct_answers: [""] });
    setShortQuestion({ question_text: "", sample_answer: "" });
    setEssayQuestion({ question_text: "", max_words: "500" });
    setFileQuestion({ question_text: "", allowed_types: "pdf,doc,docx" });
  };

  const addMatchingPair = () => {
    setMatchingQuestion(prev => ({
      ...prev,
      pairs: [...prev.pairs, { left: "", right: "" }]
    }));
  };

  const removeMatchingPair = (index: number) => {
    if (matchingQuestion.pairs.length > 2) {
      setMatchingQuestion(prev => ({
        ...prev,
        pairs: prev.pairs.filter((_, i) => i !== index)
      }));
    }
  };

  const addFillBlankAnswer = () => {
    setFillBlankQuestion(prev => ({
      ...prev,
      correct_answers: [...prev.correct_answers, ""]
    }));
  };

  if (isLoading) return <LoadingScreen />;

  const renderQuestionForm = () => {
    switch (questionType) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={mcQuestion.question_text}
                onChange={(e) => setMcQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter your question here..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <Label>Answer Options *</Label>
              {['a', 'b', 'c', 'd'].map((opt) => (
                <div key={opt}>
                  <Label htmlFor={`option${opt.toUpperCase()}`} className="text-sm">Option {opt.toUpperCase()}</Label>
                  <Input
                    id={`option${opt.toUpperCase()}`}
                    value={mcQuestion[`option_${opt}` as keyof typeof mcQuestion] as string}
                    onChange={(e) => setMcQuestion(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                    placeholder={`Enter option ${opt.toUpperCase()}`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <div>
              <Label>Correct Answer *</Label>
              <Select
                value={mcQuestion.correct_answer}
                onValueChange={(value) => setMcQuestion(prev => ({ ...prev, correct_answer: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                  <SelectItem value="d">Option D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'multiple-response':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={mcQuestion.question_text}
                onChange={(e) => setMcQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter your question here (students can select multiple answers)..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <Label>Answer Options *</Label>
              {['a', 'b', 'c', 'd'].map((opt) => (
                <div key={opt} className="flex items-center gap-3">
                  <Checkbox
                    checked={mcQuestion.correct_answers.includes(opt)}
                    onCheckedChange={(checked) => {
                      setMcQuestion(prev => ({
                        ...prev,
                        correct_answers: checked
                          ? [...prev.correct_answers, opt]
                          : prev.correct_answers.filter(a => a !== opt)
                      }));
                    }}
                  />
                  <div className="flex-1">
                    <Input
                      value={mcQuestion[`option_${opt}` as keyof typeof mcQuestion] as string}
                      onChange={(e) => setMcQuestion(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                      placeholder={`Option ${opt.toUpperCase()} (check if correct)`}
                    />
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">Check all correct answers</p>
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Statement *</Label>
              <Textarea
                id="question"
                value={tfQuestion.question_text}
                onChange={(e) => setTfQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter a true or false statement..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Correct Answer *</Label>
              <Select
                value={tfQuestion.correct_answer}
                onValueChange={(value) => setTfQuestion(prev => ({ ...prev, correct_answer: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Instructions *</Label>
              <Textarea
                id="question"
                value={matchingQuestion.question_text}
                onChange={(e) => setMatchingQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="E.g., Match the countries with their capitals..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <Label>Matching Pairs *</Label>
              {matchingQuestion.pairs.map((pair, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={pair.left}
                    onChange={(e) => {
                      const newPairs = [...matchingQuestion.pairs];
                      newPairs[index].left = e.target.value;
                      setMatchingQuestion(prev => ({ ...prev, pairs: newPairs }));
                    }}
                    placeholder={`Item ${index + 1}`}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    value={pair.right}
                    onChange={(e) => {
                      const newPairs = [...matchingQuestion.pairs];
                      newPairs[index].right = e.target.value;
                      setMatchingQuestion(prev => ({ ...prev, pairs: newPairs }));
                    }}
                    placeholder={`Match ${index + 1}`}
                    className="flex-1"
                  />
                  {matchingQuestion.pairs.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeMatchingPair(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addMatchingPair}>
                <Plus className="h-4 w-4 mr-2" /> Add Pair
              </Button>
            </div>
          </div>
        );

      case 'numeric':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={numericQuestion.question_text}
                onChange={(e) => setNumericQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter a question with a numeric answer..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="answer">Correct Answer (Number) *</Label>
              <Input
                id="answer"
                type="number"
                value={numericQuestion.correct_answer}
                onChange={(e) => setNumericQuestion(prev => ({ ...prev, correct_answer: e.target.value }))}
                placeholder="E.g., 42"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question (use ___ for blanks) *</Label>
              <Textarea
                id="question"
                value={fillBlankQuestion.question_text}
                onChange={(e) => setFillBlankQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="The capital of Nigeria is ___."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="space-y-3">
              <Label>Correct Answer(s) *</Label>
              {fillBlankQuestion.correct_answers.map((answer, index) => (
                <Input
                  key={index}
                  value={answer}
                  onChange={(e) => {
                    const newAnswers = [...fillBlankQuestion.correct_answers];
                    newAnswers[index] = e.target.value;
                    setFillBlankQuestion(prev => ({ ...prev, correct_answers: newAnswers }));
                  }}
                  placeholder={`Answer for blank ${index + 1}`}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFillBlankAnswer}>
                <Plus className="h-4 w-4 mr-2" /> Add Another Blank
              </Button>
            </div>
          </div>
        );

      case 'short-answer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={shortQuestion.question_text}
                onChange={(e) => setShortQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter a short answer question..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sample">Sample Answer (for grading reference)</Label>
              <Textarea
                id="sample"
                value={shortQuestion.sample_answer}
                onChange={(e) => setShortQuestion(prev => ({ ...prev, sample_answer: e.target.value }))}
                placeholder="Provide a sample answer for grading..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Essay Prompt *</Label>
              <Textarea
                id="question"
                value={essayQuestion.question_text}
                onChange={(e) => setEssayQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter the essay question or topic..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxWords">Maximum Word Count</Label>
              <Input
                id="maxWords"
                type="number"
                value={essayQuestion.max_words}
                onChange={(e) => setEssayQuestion(prev => ({ ...prev, max_words: e.target.value }))}
                placeholder="500"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'file-upload':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Instructions *</Label>
              <Textarea
                id="question"
                value={fileQuestion.question_text}
                onChange={(e) => setFileQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Describe what file the student should upload..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="types">Allowed File Types</Label>
              <Input
                id="types"
                value={fileQuestion.allowed_types}
                onChange={(e) => setFileQuestion(prev => ({ ...prev, allowed_types: e.target.value }))}
                placeholder="pdf,doc,docx,jpg,png"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">Comma-separated file extensions</p>
            </div>
          </div>
        );

      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-responsive">
      <div className="max-w-4xl mx-auto space-responsive">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={() => navigate(`/teacher/exam-overview?examId=${examId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-responsive-2xl font-bold">Create {getQuestionTypeLabel(questionType)} Question</h1>
            <p className="text-muted-foreground text-responsive-sm mt-1">
              Question #{questionCount + 1} for your exam
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Question Details</CardTitle>
            <CardDescription className="text-responsive-sm">
              Fill in the {getQuestionTypeLabel(questionType).toLowerCase()} question details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderQuestionForm()}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Adding..." : "Add Question"}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/teacher/exam-overview?examId=${examId}`)}>
                Done Adding Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuestions;