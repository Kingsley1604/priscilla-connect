import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Download, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LessonPlanner = () => {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("40");
  const [objectives, setObjectives] = useState("");
  const [lessonPlan, setLessonPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const grades = [
    "Play Group 1", "Play Group 2", 
    "Nursery 1", "Nursery 2",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "JSS 1", "JSS 2", "JSS 3",
    "SSS 1", "SSS 2", "SSS 3"
  ];

  const subjects = [
    "Mathematics", "English Language", "Science", "Social Studies",
    "Computer Science", "Physical Education", "Creative Arts",
    "Religious Studies", "Civic Education", "Agricultural Science",
    "Basic Technology", "Home Economics", "French", "Literature"
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !grade || !topic || !duration || !objectives) {
      toast.error("Please fill in all fields");
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 10 || durationNum > 300) {
      toast.error("Duration must be between 10-300 minutes");
      return;
    }

    if (topic.trim().length < 5) {
      toast.error("Topic must be at least 5 characters");
      return;
    }

    if (objectives.trim().length < 10) {
      toast.error("Objectives must be at least 10 characters");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("lesson-planner", {
        body: { subject, grade, topic: topic.trim(), duration: durationNum, objectives: objectives.trim() },
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes("402") || error.message?.includes("credits")) {
          toast.error("AI credits depleted. Please contact administrator.");
        } else if (error.message?.includes("429") || error.message?.includes("rate")) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else {
          toast.error("Unable to generate lesson plan. Please try again later.");
        }
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setLessonPlan(data?.lessonPlan || "");
      toast.success("Lesson plan generated successfully!");
    } catch (error: any) {
      // Handle network or unexpected errors gracefully
      const errorMessage = error?.message || "";
      if (errorMessage.includes("non-2xx") || errorMessage.includes("Edge Function")) {
        toast.error("The AI service is temporarily unavailable. Please try again in a few moments.");
      } else {
        toast.error("Something went wrong. Please check your connection and try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([lessonPlan], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${subject}_${grade}_${topic.replace(/\s+/g, "_")}_LessonPlan.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Lesson plan downloaded!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Lesson Planner</h1>
              <p className="text-white/90">Generate comprehensive lesson plans with AI assistance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Lesson Details</CardTitle>
                </div>
                <CardDescription>
                  Fill in the details to generate a comprehensive lesson plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subj) => (
                          <SelectItem key={subj} value={subj}>
                            {subj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level</Label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((gradeLevel) => (
                          <SelectItem key={gradeLevel} value={gradeLevel}>
                            {gradeLevel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic">Lesson Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Introduction to Fractions"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="20"
                      max="120"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objectives">Learning Objectives</Label>
                    <Textarea
                      id="objectives"
                      placeholder="What should students learn from this lesson? List the key objectives..."
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Lesson Plan
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Generated Lesson Plan */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Lesson Plan</CardTitle>
                  {lessonPlan && (
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Your AI-generated comprehensive lesson plan will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lessonPlan ? (
                  <div className="prose prose-sm max-w-none bg-muted rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{lessonPlan}</pre>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Fill in the form and click "Generate Lesson Plan"</p>
                    <p className="text-sm mt-2">Your lesson plan will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tips Card */}
          <Card className="shadow-soft mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Better Lesson Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Be specific with your learning objectives - what exactly should students be able to do?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Consider your students' prior knowledge and adjust the complexity accordingly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>The generated plan is a starting point - customize it based on your class needs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Plan for different learning styles and abilities in your classroom</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LessonPlanner;
