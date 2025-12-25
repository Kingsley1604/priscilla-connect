import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GamepadIcon, Trophy, Users, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const GamesArena = () => {
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
              <GamepadIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Games Arena</h1>
              <p className="text-white/90">Educational games and interactive learning</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Coming Soon Message */}
          <Card className="shadow-soft border-dashed border-2 border-muted">
            <CardContent className="py-16 text-center">
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <GamepadIcon className="h-20 w-20 text-muted-foreground" />
                  <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Coming Soon</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Exciting educational games are being developed to make learning fun and interactive. 
                Get ready for an amazing gaming experience that helps you learn!
              </p>
              
              {/* Game Categories Preview */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <div className="text-center">
                  <div className="bg-gradient-primary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Quiz Challenges</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-secondary p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Multiplayer Games</p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-accent p-3 rounded-full mx-auto mb-2 w-fit opacity-30">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground">Timed Competitions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Game Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Quiz Master</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Test your knowledge across different subjects with challenging quiz games. 
                  Earn points and compete with classmates!
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Math Race</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Speed-based mathematics game where you race against time and other students 
                  to solve problems quickly and accurately.
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-accent p-3 rounded-lg w-fit mb-2">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Science Lab</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Interactive science experiments and simulations that let you explore 
                  scientific concepts through hands-on virtual activities.
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-2">
                  <GamepadIcon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Word Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enhance your vocabulary and spelling skills through engaging word games, 
                  crosswords, and language puzzles.
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Geography Quest</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Explore the world through interactive maps, country identification games, 
                  and geographical trivia challenges.
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="bg-gradient-accent p-3 rounded-lg w-fit mb-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Team Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Collaborative games where you work with teammates to solve complex problems 
                  and complete educational missions together.
                </CardDescription>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Features */}
          <Card className="mt-8 shadow-soft bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">What to Expect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-2">🎮 Interactive Learning</h5>
                  <p className="text-sm text-muted-foreground">Learn through play with engaging educational games</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">🏆 Achievements System</h5>
                  <p className="text-sm text-muted-foreground">Earn badges and rewards for your progress</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">👥 Multiplayer Mode</h5>
                  <p className="text-sm text-muted-foreground">Compete and collaborate with classmates</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">📈 Progress Tracking</h5>
                  <p className="text-sm text-muted-foreground">Monitor your learning progress and improvements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default GamesArena;