import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Brain, BookOpen, Calculator, Globe, Beaker, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const PriscillaBrain = () => {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjects = [
    { name: "Mathematics", icon: Calculator, color: "bg-gradient-primary" },
    { name: "Science", icon: Beaker, color: "bg-gradient-secondary" },
    { name: "English", icon: BookOpen, color: "bg-gradient-accent" },
    { name: "Geography", icon: Globe, color: "bg-gradient-primary" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsSubmitting(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsSubmitting(false);
      setQuestion("");
    }, 2000);
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
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priscilla Brain</h1>
              <p className="text-white/90">AI-powered homework assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* AI Assistant Card */}
          <Card className="shadow-soft mb-8">
            <CardHeader className="text-center">
              <div className="mx-auto bg-gradient-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Ask Priscilla Brain</CardTitle>
              <CardDescription>
                Get help with your homework, explanations for difficult concepts, and step-by-step solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium mb-2">
                    What would you like help with?
                  </label>
                  <Textarea
                    id="question"
                    placeholder="Type your question here... (e.g., 'Explain photosynthesis', 'Solve 2x + 5 = 15', 'Help with essay writing')"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!question.trim() || isSubmitting}
                >
                  {isSubmitting ? "Thinking..." : "Ask Priscilla Brain"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subjects */}
          <h3 className="text-xl font-semibold mb-6 text-foreground">Popular Subjects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {subjects.map((subject) => (
              <Card key={subject.name} className="shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto ${subject.color} p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <subject.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-foreground">{subject.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Example Questions */}
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Example Questions
              </CardTitle>
              <CardDescription>Try asking these types of questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-foreground">Mathematics</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• "Solve the equation 3x + 7 = 22"</li>
                    <li>• "Explain the Pythagorean theorem"</li>
                    <li>• "How do I find the area of a circle?"</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-foreground">Science</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• "What is photosynthesis?"</li>
                    <li>• "Explain Newton's laws of motion"</li>
                    <li>• "How does the water cycle work?"</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-foreground">English</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• "Help me write an essay about climate change"</li>
                    <li>• "Explain metaphors and similes"</li>
                    <li>• "What is the main theme of Romeo and Juliet?"</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-foreground">History</h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• "Tell me about World War II"</li>
                    <li>• "What caused the Industrial Revolution?"</li>
                    <li>• "Explain the American Civil Rights Movement"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">What Priscilla Brain Can Do</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-2">✨ Instant Help</h5>
                  <p className="text-sm text-muted-foreground">Get immediate answers to your homework questions</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">📚 Step-by-Step Solutions</h5>
                  <p className="text-sm text-muted-foreground">Learn with detailed explanations and examples</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">🎯 Subject Coverage</h5>
                  <p className="text-sm text-muted-foreground">All subjects from primary to secondary level</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">🤖 AI-Powered</h5>
                  <p className="text-sm text-muted-foreground">Advanced AI understands your learning style</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PriscillaBrain;