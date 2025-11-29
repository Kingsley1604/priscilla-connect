import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CreateQuestions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const examId = new URLSearchParams(location.search).get('examId');

  const [question, setQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "a" as "a" | "b" | "c" | "d"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!examId) {
      toast.error("No exam selected");
      return;
    }

    if (!question.question_text || !question.option_a || !question.option_b || 
        !question.option_c || !question.option_d) {
      toast.error("Please fill in all fields");
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

      const { error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: examId,
          question_text: question.question_text,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          question_order: nextOrder
        });

      if (error) throw error;

      toast.success("Question added successfully!");
      setQuestion({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "a"
      });
    } catch (error) {
      toast.error("Failed to add question");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exam-overview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Multiple Choice Question</h1>
            <p className="text-muted-foreground mt-1">
              Add a new question to your exam
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
            <CardDescription>Fill in the question and answer options below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={question.question_text}
                onChange={(e) => setQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Answer Options *</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="optionA" className="text-sm">Option A</Label>
                  <Input
                    id="optionA"
                    value={question.option_a}
                    onChange={(e) => setQuestion(prev => ({ ...prev, option_a: e.target.value }))}
                    placeholder="Enter option A"
                  />
                </div>
                <div>
                  <Label htmlFor="optionB" className="text-sm">Option B</Label>
                  <Input
                    id="optionB"
                    value={question.option_b}
                    onChange={(e) => setQuestion(prev => ({ ...prev, option_b: e.target.value }))}
                    placeholder="Enter option B"
                  />
                </div>
                <div>
                  <Label htmlFor="optionC" className="text-sm">Option C</Label>
                  <Input
                    id="optionC"
                    value={question.option_c}
                    onChange={(e) => setQuestion(prev => ({ ...prev, option_c: e.target.value }))}
                    placeholder="Enter option C"
                  />
                </div>
                <div>
                  <Label htmlFor="optionD" className="text-sm">Option D</Label>
                  <Input
                    id="optionD"
                    value={question.option_d}
                    onChange={(e) => setQuestion(prev => ({ ...prev, option_d: e.target.value }))}
                    placeholder="Enter option D"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="correctAnswer">Correct Answer *</Label>
              <Select
                value={question.correct_answer}
                onValueChange={(value: "a" | "b" | "c" | "d") => 
                  setQuestion(prev => ({ ...prev, correct_answer: value }))
                }
              >
                <SelectTrigger id="correctAnswer">
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

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Adding..." : "Add Question"}
              </Button>
              <Button variant="outline" onClick={() => navigate('/teacher/exam-overview')}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuestions;