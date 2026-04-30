import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, BookOpen, Calculator, Globe, Beaker, Send, Sparkles, History, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BrainHistoryItem {
  id: string;
  query_type: "assignment" | "research";
  question: string;
  answer: string;
  created_at: string;
}

const PriscillaBrain = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [queryType, setQueryType] = useState<"assignment" | "research">("assignment");
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [history, setHistory] = useState<BrainHistoryItem[]>([]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    const sb: any = supabase;
    const { data, error } = await sb
      .from("priscilla_brain_history")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Error loading brain history:", error);
      return;
    }
    setHistory((data || []) as BrainHistoryItem[]);
  };

  const deleteHistoryItem = async (id: string) => {
    const sb: any = supabase;
    const { error } = await sb.from("priscilla_brain_history").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete history item");
      return;
    }
    toast.success("Removed from history");
    loadHistory();
  };

  const openFromHistory = (item: BrainHistoryItem) => {
    setQueryType(item.query_type);
    setMessages([
      { role: "user", content: item.question },
      { role: "assistant", content: item.answer },
    ]);
    setActiveTab("chat");
  };

  const subjects = [
    { name: "Mathematics", icon: Calculator, color: "bg-gradient-primary" },
    { name: "Science", icon: Beaker, color: "bg-gradient-secondary" },
    { name: "English", icon: BookOpen, color: "bg-gradient-accent" },
    { name: "Geography", icon: Globe, color: "bg-gradient-primary" },
  ];

  const exampleQuestions = {
    assignment: [
      "How do I solve 2x + 5 = 15?",
      "What are the steps to write a good essay?",
      "How do I simplify fractions?",
      "What's the process for long division?",
    ],
    research: [
      "Who is the CEO of Goat Factory?",
      "What year was Microsoft founded?",
      "What are the continents of the world?",
      "Who invented the telephone?",
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting) return;

    if (question.trim().length < 10) {
      toast.error("Please enter at least 10 characters for your question");
      return;
    }

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("priscilla-brain", {
        body: { question, type: queryType },
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.includes("402") || error.message?.includes("credits")) {
          toast.error("AI credits depleted. Please contact administrator.");
        } else if (error.message?.includes("429") || error.message?.includes("rate")) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else {
          toast.error("Unable to process your question. Please try again later.");
        }
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.answer || "I couldn't generate a response. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Persist to history (research only by spec, but we save both for completeness)
      if (user && data?.answer) {
        const sb: any = supabase;
        const { error: insertError } = await sb.from("priscilla_brain_history").insert({
          student_id: user.id,
          query_type: queryType,
          question: question.trim(),
          answer: data.answer,
        });
        if (!insertError) loadHistory();
      }

      setQuestion("");
    } catch (error: any) {
      // Handle network or unexpected errors gracefully
      const errorMessage = error?.message || "";
      if (errorMessage.includes("non-2xx") || errorMessage.includes("Edge Function")) {
        toast.error("The AI service is temporarily unavailable. Please try again in a few moments.");
      } else {
        toast.error("Something went wrong. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
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
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priscilla Brain</h1>
              <p className="text-white/90">AI-powered homework assistant & research tool</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Query Type Selector */}
          <Card className="shadow-soft mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  variant={queryType === "assignment" ? "default" : "outline"}
                  onClick={() => setQueryType("assignment")}
                  className="flex-1"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Assignment Help
                </Button>
                <Button
                  variant={queryType === "research" ? "default" : "outline"}
                  onClick={() => setQueryType("research")}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Research
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                {queryType === "assignment"
                  ? "Get step-by-step guidance for your homework (not direct answers)"
                  : "Find information and facts for your research projects"}
              </p>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Ask Priscilla Brain</CardTitle>
              </div>
              <CardDescription>
                {queryType === "assignment"
                  ? "I'll guide you through solving your problems step by step"
                  : "I'll help you find accurate information for your research"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              {messages.length > 0 && (
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {msg.role === "assistant" && <Brain className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder={
                    queryType === "assignment"
                      ? "Type your homework question here... (e.g., 'How do I solve 2x + 5 = 15?')"
                      : "Type your research question here... (e.g., 'Who is the CEO of Goat Factory?')"
                  }
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button type="submit" className="w-full" disabled={!question.trim() || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-pulse" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Ask Priscilla Brain
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Example Questions */}
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Example Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exampleQuestions[queryType].map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="text-left h-auto py-3 px-4 justify-start"
                    onClick={() => setQuestion(example)}
                  >
                    <span className="text-sm">{example}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <h3 className="text-xl font-semibold mb-6 text-foreground">Popular Subjects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {subjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <Card key={index} className={`${subject.color} text-white shadow-medium hover:scale-105 transition-transform cursor-pointer`}>
                  <CardContent className="pt-6 text-center">
                    <Icon className="h-12 w-12 mx-auto mb-3" />
                    <h4 className="font-semibold">{subject.name}</h4>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>How Priscilla Brain Helps You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queryType === "assignment" ? (
                  <>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">1</Badge>
                      <p className="text-sm text-muted-foreground">
                        Breaks down complex problems into simple steps
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">2</Badge>
                      <p className="text-sm text-muted-foreground">
                        Guides you without giving away the answers
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">3</Badge>
                      <p className="text-sm text-muted-foreground">
                        Explains concepts you need to understand
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">4</Badge>
                      <p className="text-sm text-muted-foreground">
                        Helps you learn by thinking through problems yourself
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">1</Badge>
                      <p className="text-sm text-muted-foreground">
                        Provides accurate, verified information
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">2</Badge>
                      <p className="text-sm text-muted-foreground">
                        Answers questions about people, places, and events
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">3</Badge>
                      <p className="text-sm text-muted-foreground">
                        Explains concepts in simple, easy-to-understand language
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary">4</Badge>
                      <p className="text-sm text-muted-foreground">
                        Helps you complete research projects successfully
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PriscillaBrain;
