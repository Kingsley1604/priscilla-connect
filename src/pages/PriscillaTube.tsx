import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, Clock, Eye, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const PriscillaTube = () => {
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
              <PlayCircle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priscilla Tube</h1>
              <p className="text-white/90">Educational videos and learning content</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* No Videos Available Message */}
          <Card className="shadow-soft border-dashed border-2 border-muted">
            <CardContent className="py-16 text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <PlayCircle className="h-20 w-20 text-muted-foreground" />
                  <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">No Video Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Educational videos are being prepared by our teachers and will be available soon. 
                Check back later for exciting learning content!
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="text-center">
                  <div className="bg-gradient-primary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Subject Lessons</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-secondary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Exam Prep</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-accent p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Live Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-2">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Subject Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive video lessons covering all subjects in your curriculum, 
                  from basic concepts to advanced topics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Exam Preparation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Targeted video content to help you prepare for JAMB, WAEC, NECO, 
                  and other important examinations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-accent p-3 rounded-lg w-fit mb-2">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Live Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Interactive live streaming classes where you can ask questions 
                  and engage with teachers in real-time.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Video Categories Preview */}
          <Card className="mt-8 shadow-soft bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Video Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl mb-2">📐</div>
                  <p className="text-sm font-medium">Mathematics</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl mb-2">🔬</div>
                  <p className="text-sm font-medium">Science</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl mb-2">📚</div>
                  <p className="text-sm font-medium">English</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <div className="text-2xl mb-2">🌍</div>
                  <p className="text-sm font-medium">Geography</p>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PriscillaTube;