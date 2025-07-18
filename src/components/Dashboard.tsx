import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  GraduationCap,
  Bell,
  Settings,
  PlayCircle,
  Brain,
  FileText,
  GamepadIcon
} from "lucide-react";

interface DashboardProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userAvatar?: string;
}

const Dashboard = ({ userRole, userName, userAvatar }: DashboardProps) => {
  const getModulesForRole = () => {
    const baseModules = [
      { title: "Reports", description: "View academic reports", icon: FileText, color: "bg-gradient-primary" },
      { title: "Calendar", description: "School events & schedules", icon: Calendar, color: "bg-gradient-secondary" },
      { title: "Messages", description: "Communication hub", icon: MessageSquare, color: "bg-gradient-accent" },
    ];

    const studentModules = [
      { title: "Priscilla Brain", description: "AI homework assistant", icon: Brain, color: "bg-gradient-primary" },
      { title: "Priscilla Tube", description: "Educational videos", icon: PlayCircle, color: "bg-gradient-secondary" },
      { title: "Games Arena", description: "Educational games", icon: GamepadIcon, color: "bg-gradient-accent" },
      { title: "Achievements", description: "Your badges & rewards", icon: Trophy, color: "bg-gradient-primary" },
    ];

    const teacherModules = [
      { title: "Class Management", description: "Manage your classes", icon: Users, color: "bg-gradient-primary" },
      { title: "Analytics", description: "Student performance", icon: BarChart3, color: "bg-gradient-secondary" },
      { title: "Content Upload", description: "Upload educational content", icon: BookOpen, color: "bg-gradient-accent" },
    ];

    const adminModules = [
      { title: "School Management", description: "Overall school admin", icon: GraduationCap, color: "bg-gradient-primary" },
      { title: "User Management", description: "Manage all users", icon: Users, color: "bg-gradient-secondary" },
      { title: "System Settings", description: "Platform configuration", icon: Settings, color: "bg-gradient-accent" },
    ];

    if (userRole === 'student') return [...baseModules, ...studentModules];
    if (userRole === 'teacher') return [...baseModules, ...teacherModules];
    return [...baseModules, ...adminModules];
  };

  const modules = getModulesForRole();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priscilla Connect</h1>
              <p className="text-white/90">Empowering Education Together</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-white/20 text-white">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-medium">{userName}</p>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back, {userName.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground">
              {userRole === 'student' && "Ready to learn something amazing today?"}
              {userRole === 'teacher' && "Ready to inspire young minds today?"}
              {userRole === 'admin' && "Let's make education better together."}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  {userRole === 'student' ? 'Subjects' : userRole === 'teacher' ? 'Classes' : 'Schools'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">
                  {userRole === 'student' ? '8' : userRole === 'teacher' ? '5' : '12'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'student' ? 'Active subjects' : userRole === 'teacher' ? 'Teaching classes' : 'Managed schools'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-accent" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-1">
                  {userRole === 'student' ? '15' : userRole === 'teacher' ? '23' : '47'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'student' ? 'Badges earned' : userRole === 'teacher' ? 'Student milestones' : 'System achievements'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-secondary" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-1">87%</div>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'student' ? 'Overall performance' : userRole === 'teacher' ? 'Class average' : 'System health'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Your Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Card 
                key={module.title} 
                className="group cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1 shadow-soft"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${module.color} shadow-soft`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Open
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;