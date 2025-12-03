import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AdminNotificationSystem from "@/components/notifications/AdminNotificationSystem";
import TeacherExamNotifications from "@/components/notifications/TeacherExamNotifications";
import MessageInput from "@/components/messaging/MessageInput";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import StudentDashboardWidget from "@/components/student/StudentDashboardWidget";
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Bell,
  Settings,
  PlayCircle,
  Brain,
  Package,
  FileText,
  GamepadIcon,
  ShoppingBag
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

interface DashboardProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userAvatar?: string;
  onLogout?: () => void;
}

const Dashboard = ({ userRole, userName, userAvatar, onLogout }: DashboardProps) => {
  const navigate = useNavigate();
  const getModulesForRole = () => {
    const baseModules: Array<{title: string, description: string, icon: any, color: string, path: string, disabled?: boolean}> = [
      { title: "Reports", description: "View academic reports", icon: FileText, color: "bg-gradient-primary", path: "/reports" },
      { title: "Calendar", description: "School events & schedules", icon: Calendar, color: "bg-gradient-secondary", path: "/calendar" },
      { title: "Messages", description: "Communication hub", icon: MessageSquare, color: "bg-gradient-accent", path: "/messages" },
    ];

    const studentModules: Array<{title: string, description: string, icon: any, color: string, path: string, disabled?: boolean}> = [
      { title: "Take Exam", description: "Take entrance or CBT exam", icon: FileText, color: "bg-gradient-primary", path: "/student/exam" },
      { title: "Homework", description: "View and submit homework", icon: FileText, color: "bg-gradient-secondary", path: "/student/homework" },
      { title: "Store", description: "School supplies & uniforms", icon: ShoppingBag, color: "bg-gradient-accent", path: "/store" },
      { title: "Priscilla Brain", description: "AI homework assistant", icon: Brain, color: "bg-gradient-primary", path: "/priscilla-brain" },
      { title: "Priscilla Tube", description: "Educational videos", icon: PlayCircle, color: "bg-gradient-secondary", path: "/priscilla-tube" },
      { title: "Games Arena", description: "Educational games", icon: GamepadIcon, color: "bg-gradient-accent", path: "/games-arena" },
      { title: "Achievements", description: "Your badges & rewards", icon: Trophy, color: "bg-gradient-primary", path: "/achievements" },
    ];

    const teacherModules: Array<{title: string, description: string, icon: any, color: string, path: string, disabled?: boolean}> = [
      { title: "Create Exam", description: "Build custom exams", icon: Settings, color: "bg-gradient-primary", path: "/teacher/exam-builder" },
      { title: "AI Lesson Planner", description: "Generate lesson plans with AI", icon: Brain, color: "bg-gradient-accent", path: "/teacher/lesson-planner" },
      { title: "Class Management", description: "Manage your classes", icon: Users, color: "bg-gradient-primary", path: "/teacher/class-management", disabled: true },
      { title: "Analytics", description: "Student performance", icon: BarChart3, color: "bg-gradient-secondary", path: "/teacher/analytics", disabled: true },
      { title: "Content Upload", description: "Upload learning materials", icon: BookOpen, color: "bg-gradient-accent", path: "/teacher/content-upload", disabled: true },
      { title: "Profile Settings", description: "Update your information", icon: Settings, color: "bg-gradient-secondary", path: "/profile-settings" },
    ];

    const adminModules: Array<{title: string, description: string, icon: any, color: string, path: string, disabled?: boolean}> = [
      { title: "Pass Announcement", description: "Send announcement to public", icon: Bell, color: "bg-gradient-primary", path: "/admin/pass-announcement" },
      { title: "Teacher Assignments", description: "Assign teachers to classes", icon: Users, color: "bg-gradient-secondary", path: "/admin/teacher-assignments" },
      { title: "Manage Results", description: "Approve exam results", icon: Trophy, color: "bg-gradient-primary", path: "/admin/exam-results" },
      { title: "Manage Store", description: "Add and manage store items", icon: ShoppingBag, color: "bg-gradient-secondary", path: "/admin/manage-store" },
      { title: "Manage PriscillaTube", description: "Review video content", icon: PlayCircle, color: "bg-gradient-accent", path: "/admin/manage-priscilla-tube" },
      { title: "Announcements", description: "Manage announcements", icon: Bell, color: "bg-gradient-accent", path: "/admin/manage-announcements" },
      { title: "System Settings", description: "Platform configuration", icon: Settings, color: "bg-gradient-secondary", path: "/admin/system-settings" },
      { title: "Inventory Manager", description: "Monitor stock levels & alerts", icon: Package, color: "bg-gradient-primary", path: "/admin/inventory-manager" },
      { title: "Profile Settings", description: "Update your information", icon: Settings, color: "bg-gradient-primary", path: "/admin/profile-settings" },
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
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <img src={priscillaLogo} alt="Priscilla Connect" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priscilla Connect</h1>
              <p className="text-white/90">Empowering Education Together</p>
            </div>
          </div>
          
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {userRole === 'teacher' && <TeacherExamNotifications />}
              <AdminNotificationSystem />
              {onLogout && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              )}
              {userRole === 'student' ? (
                <Link to="/profile-settings">
                  <div className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors">
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
                </Link>
              ) : (
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
              )}
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
          

          {/* Announcements */}
          {(userRole === 'student' || userRole === 'teacher') && (
            <AnnouncementBanner userRole={userRole} />
          )}

      {/* Student Dashboard Widget */}
          {userRole === 'student' && (
            <div className="mb-8">
              <StudentDashboardWidget />
            </div>
          )}

          {/* Quick Stats for non-students */}
          {userRole !== 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    {userRole === 'teacher' ? 'Classes' : 'Schools'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {userRole === 'teacher' ? '5' : '12'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRole === 'teacher' ? 'Teaching classes' : 'Managed schools'}
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
                    {userRole === 'teacher' ? '23' : '47'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {userRole === 'teacher' ? 'Student milestones' : 'System achievements'}
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
                    {userRole === 'teacher' ? 'Class average' : 'System health'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Your Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <Link key={module.title} to={module.disabled ? "#" : (module.path || "#")} className={module.disabled ? "pointer-events-none" : ""}>
                <Card 
                  className={`group cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1 shadow-soft ${module.disabled ? 'opacity-60' : ''}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${module.color} shadow-soft ${module.disabled ? 'opacity-70' : ''}`}>
                        <module.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className={`${module.disabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {module.disabled ? "Coming Soon" : "Open"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className={`text-lg mb-2 transition-colors ${module.disabled ? 'text-muted-foreground' : 'group-hover:text-primary'}`}>
                      {module.title}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Content Monitoring Demo */}
      <section className="pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Content Monitoring Demo</h3>
          <MessageInput />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;