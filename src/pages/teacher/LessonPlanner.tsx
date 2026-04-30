import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Download, Sparkles, History, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface LessonPlanHistory {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  objectives: string;
  generated_plan: string;
  created_at: string;
}

const LessonPlanner = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("40");
  const [objectives, setObjectives] = useState("");
  const [lessonPlan, setLessonPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [history, setHistory] = useState<LessonPlanHistory[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanHistory | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('lesson_plan_history')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

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

      const generatedPlan = data?.lessonPlan || "";
      setLessonPlan(generatedPlan);
      
      // Save to history
      if (user && generatedPlan) {
        const { error: saveError } = await supabase
          .from('lesson_plan_history')
          .insert({
            teacher_id: user.id,
            subject,
            grade,
            topic: topic.trim(),
            duration: durationNum,
            objectives: objectives.trim(),
            generated_plan: generatedPlan
          });

        if (saveError) {
          console.error('Error saving to history:', saveError);
        } else {
          loadHistory();
        }
      }

      toast.success("Lesson plan generated successfully!");
    } catch (error: any) {
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

  const handleDownload = async () => {
    const planToDownload = selectedPlan?.generated_plan || lessonPlan;
    const planSubject = selectedPlan?.subject || subject;
    const planGrade = selectedPlan?.grade || grade;
    const planTopic = selectedPlan?.topic || topic;

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      const lines = planToDownload.split('\n');
      const children: any[] = [];
      
      lines.forEach(line => {
        if (line.startsWith('# ')) {
          children.push(new Paragraph({
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }));
        } else if (line.startsWith('## ')) {
          children.push(new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 150 }
          }));
        } else if (line.startsWith('### ')) {
          children.push(new Paragraph({
            text: line.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 }
          }));
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          children.push(new Paragraph({
            text: line.replace(/^[-*] /, ''),
            bullet: { level: 0 },
            spacing: { after: 50 }
          }));
        } else if (line.trim()) {
          children.push(new Paragraph({
            children: [new TextRun(line)],
            spacing: { after: 100 }
          }));
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `${planSubject} - ${planGrade}`,
              heading: HeadingLevel.TITLE,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Topic: ${planTopic}`,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 300 }
            }),
            ...children
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const { saveAs } = await import('file-saver');
      saveAs(blob, `${planSubject}_${planGrade}_${planTopic.replace(/\s+/g, "_")}_LessonPlan.docx`);
      toast.success("Lesson plan downloaded as Word document!");
    } catch (error) {
      console.error('Download error:', error);
      const element = document.createElement("a");
      const file = new Blob([planToDownload], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${planSubject}_${planGrade}_${planTopic.replace(/\s+/g, "_")}_LessonPlan.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Lesson plan downloaded!");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lesson_plan_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Lesson plan deleted");
      loadHistory();
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium">
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
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">AI Lesson Planner</h1>
              <p className="text-white/90 text-sm sm:text-base">Generate comprehensive lesson plans with AI assistance</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="create">
                <Sparkles className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
            </TabsContent>

            <TabsContent value="history">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* History List */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Previous Lesson Plans</CardTitle>
                    <CardDescription>
                      View and download your previously generated lesson plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      <TooltipProvider delayDuration={150}>
                        {history.map((plan) => {
                          const isSelected = selectedPlan?.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`group border rounded-lg transition-colors ${
                                isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                              }`}
                            >
                              <div
                                className="p-4 flex items-start justify-between cursor-pointer"
                                onClick={() => setSelectedPlan(plan)}
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{plan.topic}</h4>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {plan.subject} • {plan.grade}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(plan.created_at), 'MMM dd, yyyy HH:mm')}
                                  </p>
                                </div>
                                <div
                                  className={`flex gap-1 transition-opacity duration-200 ${
                                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                                  }`}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        aria-label="View lesson plan"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPlan(plan);
                                          // Smooth-scroll to the preview pane.
                                          setTimeout(() => {
                                            previewRef.current?.scrollIntoView({
                                              behavior: 'smooth',
                                              block: 'start',
                                            });
                                          }, 80);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View lesson plan</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        aria-label="Delete lesson plan"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPendingDeleteId(plan.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete lesson plan</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </TooltipProvider>

                      {history.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No lesson plans in history yet</p>
                          <p className="text-sm mt-2">Generate a lesson plan to see it here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Plan Preview */}
                <Card ref={previewRef} className="shadow-soft scroll-mt-24">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {selectedPlan ? selectedPlan.topic : 'Select a Lesson Plan'}
                      </CardTitle>
                      {selectedPlan && (
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                    {selectedPlan && (
                      <CardDescription>
                        {selectedPlan.subject} • {selectedPlan.grade} • {selectedPlan.duration} minutes
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {selectedPlan ? (
                      <div
                        key={selectedPlan.id}
                        className="prose prose-sm max-w-none bg-muted rounded-lg p-4 max-h-[600px] overflow-y-auto animate-accordion-down"
                      >
                        <pre className="whitespace-pre-wrap text-sm font-sans">{selectedPlan.generated_plan}</pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a lesson plan from the list</p>
                        <p className="text-sm mt-2">The plan content will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

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

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lesson plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The lesson plan will be permanently removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const id = pendingDeleteId;
                setPendingDeleteId(null);
                if (id) await handleDeleteHistory(id);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LessonPlanner;