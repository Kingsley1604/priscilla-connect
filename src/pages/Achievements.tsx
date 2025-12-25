import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Star, Award, Medal } from "lucide-react";
import { Link } from "react-router-dom";

const Achievements = () => {
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
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Achievements</h1>
              <p className="text-white/90">Your badges, awards and accomplishments</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* No Achievements Message */}
          <Card className="shadow-soft border-dashed border-2 border-muted">
            <CardContent className="py-16 text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <Trophy className="h-20 w-20 text-muted-foreground" />
                  <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">No Achievement Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start your learning journey to unlock amazing achievements! Complete assignments, 
                excel in exams, and participate in school activities to earn your first badge.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="text-center">
                  <div className="bg-gradient-primary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Academic Excellence</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-secondary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Medal className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Perfect Attendance</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-accent p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Top Performer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-2">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Academic</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Earn badges for excellent grades, perfect assignments, and academic milestones.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-2">
                  <Medal className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get recognized for class participation, group activities, and school events.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-accent p-3 rounded-lg w-fit mb-2">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Special</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Unlock special achievements for leadership, innovation, and community service.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Achievements;