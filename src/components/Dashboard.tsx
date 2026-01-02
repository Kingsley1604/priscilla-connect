import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AdminNotificationSystem from "@/components/notifications/AdminNotificationSystem";
import TeacherExamNotifications from "@/components/notifications/TeacherExamNotifications";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import StudentDashboardWidget from "@/components/student/StudentDashboardWidget";
import SystemHealthCard from "@/components/dashboard/SystemHealthCard";
import { BookOpen, Users, Trophy, Calendar, MessageSquare, BarChart3, Bell, Settings, PlayCircle, Brain, Package, FileText, GamepadIcon, ShoppingBag, Menu, X, User, LogOut, Moon, UserX, GraduationCap, ClipboardList } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link, useNavigate } from "react-router-dom";
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
interface DashboardProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userAvatar?: string;
  onLogout?: () => void;
}
const Dashboard = ({
  userRole,
  userName,
  userAvatar,
  onLogout
}: DashboardProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const getProfilePath = () => {
    if (userRole === 'teacher') return '/teacher/profile-options';
    if (userRole === 'admin') return '/admin/profile-settings';
    return '/profile-settings';
  };
  const getModulesForRole = () => {
    const baseModules: Array<{
      title: string;
      description: string;
      icon: any;
      color: string;
      path: string;
      disabled?: boolean;
    }> = [{
      title: "Reports",
      description: "View academic reports",
      icon: FileText,
      color: "bg-gradient-primary",
      path: "/reports"
    }, {
      title: "Calendar",
      description: "School events & schedules",
      icon: Calendar,
      color: "bg-gradient-secondary",
      path: "/calendar"
    }, {
      title: "Messages",
      description: "Communication hub",
      icon: MessageSquare,
      color: "bg-gradient-accent",
      path: "/messages"
    }];
    const studentModules: Array<{
      title: string;
      description: string;
      icon: any;
      color: string;
      path: string;
      disabled?: boolean;
    }> = [{
      title: "Take Exam",
      description: "Take entrance or CBT exam",
      icon: FileText,
      color: "bg-gradient-primary",
      path: "/student/exam"
    }, {
      title: "Homework",
      description: "View and submit homework",
      icon: FileText,
      color: "bg-gradient-secondary",
      path: "/student/homework"
    }, {
      title: "Store",
      description: "School supplies & uniforms",
      icon: ShoppingBag,
      color: "bg-gradient-accent",
      path: "/store"
    }, {
      title: "Priscilla Brain",
      description: "AI homework assistant",
      icon: Brain,
      color: "bg-gradient-primary",
      path: "/priscilla-brain"
    }, {
      title: "Priscilla Tube",
      description: "Educational videos",
      icon: PlayCircle,
      color: "bg-gradient-secondary",
      path: "/priscilla-tube"
    }, {
      title: "Games Arena",
      description: "Educational games",
      icon: GamepadIcon,
      color: "bg-gradient-accent",
      path: "/games-arena"
    }, {
      title: "Achievements",
      description: "Your badges & rewards",
      icon: Trophy,
      color: "bg-gradient-primary",
      path: "/achievements"
    }];
    const teacherModules: Array<{
      title: string;
      description: string;
      icon: any;
      color: string;
      path: string;
      disabled?: boolean;
    }> = [{
      title: "Assign Homework",
      description: "Create homework for students",
      icon: ClipboardList,
      color: "bg-gradient-primary",
      path: "/teacher/homework-assignment"
    }, {
      title: "Create Exam",
      description: "Build custom exams",
      icon: Settings,
      color: "bg-gradient-secondary",
      path: "/teacher/exam-builder"
    }, {
      title: "AI Lesson Planner",
      description: "Generate lesson plans with AI",
      icon: Brain,
      color: "bg-gradient-accent",
      path: "/teacher/lesson-planner"
    }, {
      title: "Class Management",
      description: "Manage your classes",
      icon: Users,
      color: "bg-gradient-primary",
      path: "/teacher/class-management"
    }, {
      title: "Analytics",
      description: "Student performance",
      icon: BarChart3,
      color: "bg-gradient-accent",
      path: "/teacher/analytics",
      disabled: true
    }, {
      title: "Content Upload",
      description: "Upload learning materials",
      icon: BookOpen,
      color: "bg-gradient-primary",
      path: "/teacher/content-upload",
      disabled: true
    }];
    const adminModules: Array<{
      title: string;
      description: string;
      icon: any;
      color: string;
      path: string;
      disabled?: boolean;
    }> = [{
      title: "Pass Announcement",
      description: "Send announcement to public",
      icon: Bell,
      color: "bg-gradient-primary",
      path: "/admin/pass-announcement"
    }, {
      title: "Create Teacher",
      description: "Add new teacher accounts",
      icon: Users,
      color: "bg-gradient-secondary",
      path: "/admin/teacher-creation"
    }, {
      title: "Create Class",
      description: "Create new classes",
      icon: GraduationCap,
      color: "bg-gradient-accent",
      path: "/admin/create-class"
    }, {
      title: "Teacher Assignments",
      description: "Assign teachers to classes",
      icon: Users,
      color: "bg-gradient-primary",
      path: "/admin/teacher-assignments"
    }, {
      title: "Deactivate Teacher",
      description: "Deactivate teacher accounts",
      icon: UserX,
      color: "bg-red-500",
      path: "/admin/deactivate-teacher"
    }, {
      title: "Manage Results",
      description: "Approve exam results",
      icon: Trophy,
      color: "bg-gradient-secondary",
      path: "/admin/exam-results"
    }, {
      title: "Manage Store",
      description: "Add and manage store items",
      icon: ShoppingBag,
      color: "bg-gradient-accent",
      path: "/admin/manage-store"
    }, {
      title: "Manage PriscillaTube",
      description: "Review video content",
      icon: PlayCircle,
      color: "bg-gradient-primary",
      path: "/admin/manage-priscilla-tube"
    }, {
      title: "Announcements",
      description: "Manage announcements",
      icon: Bell,
      color: "bg-gradient-secondary",
      path: "/admin/manage-announcements"
    }, {
      title: "System Settings",
      description: "Platform configuration",
      icon: Settings,
      color: "bg-gradient-accent",
      path: "/admin/system-settings"
    }, {
      title: "Inventory Manager",
      description: "Monitor stock levels & alerts",
      icon: Package,
      color: "bg-gradient-primary",
      path: "/admin/inventory-manager"
    }];
    if (userRole === 'student') return [...baseModules, ...studentModules];
    if (userRole === 'teacher') return [...baseModules, ...teacherModules];
    return [...baseModules, ...adminModules];
  };
  const modules = getModulesForRole();
  const MobileMenuItem = ({
    icon: Icon,
    label,
    onClick,
    variant = 'default'
  }: {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }) => <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${variant === 'destructive' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-foreground hover:bg-muted'}`}>
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-3 sm:px-6 shadow-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg backdrop-blur-sm py-0 px-0">
              <img src={priscillaLogo} alt="Priscilla Connect" className="h-8 w-8 sm:h-12 sm:w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Priscilla Connect</h1>
              <p className="text-white/90 text-xs sm:text-sm md:text-base hidden sm:block">Empowering Education Together</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            {userRole === 'teacher' && <TeacherExamNotifications />}
            <AdminNotificationSystem />
            {onLogout && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs sm:text-sm">
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be signed out of Priscilla Connect.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, I want to stay</AlertDialogCancel>
                    <AlertDialogAction onClick={onLogout}>Yes, I do want to leave</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Link to={getProfilePath()}>
              <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-colors">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-white/30">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-white/20 text-white text-xs sm:text-sm">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right hidden md:block">
                  <p className="font-medium text-sm">{userName}</p>
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="sm:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <SheetTitle className="text-base">{userName}</SheetTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </SheetHeader>
                
                <div className="p-2 space-y-1">
                  <MobileMenuItem icon={User} label="Profile" onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(getProfilePath());
                }} />
                  <MobileMenuItem icon={Settings} label="Settings" onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(userRole === 'teacher' ? '/teacher/profile-options' : getProfilePath());
                }} />
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">Night Mode</span>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  <div className="border-t my-2" />
                  
                  {onLogout && <MobileMenuItem icon={LogOut} label="Logout" onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }} variant="destructive" />}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
              Welcome back, {userName.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {userRole === 'student' && "Ready to learn something amazing today?"}
              {userRole === 'teacher' && "Ready to inspire young minds today?"}
              {userRole === 'admin' && "Let's make education better together."}
            </p>
          </div>
          

          {/* Announcements */}
          {(userRole === 'student' || userRole === 'teacher') && <AnnouncementBanner userRole={userRole} />}

      {/* Student Dashboard Widget */}
          {userRole === 'student' && <div className="mb-6 sm:mb-8">
              <StudentDashboardWidget />
            </div>}

          {/* Quick Stats for non-students */}
          {userRole !== 'student' && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="pb-2 p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
                      <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                      {userRole === 'teacher' ? 'Classes' : 'School Sections'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1">
                      {userRole === 'teacher' ? '5' : '3'}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {userRole === 'teacher' ? 'Teaching classes' : 'Nursery, Primary & Secondary'}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-accent" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent mb-1">
                    {userRole === 'teacher' ? '23' : '47'}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {userRole === 'teacher' ? 'Student milestones' : 'System achievements'}
                  </p>
                </CardContent>
              </Card>

              <SystemHealthCard userRole={userRole} />
            </div>}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="pb-8 sm:pb-10 md:pb-12 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 text-foreground">Your Dashboard</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {modules.map((module, index) => <Link key={module.title} to={module.disabled ? "#" : module.path || "#"} className={module.disabled ? "pointer-events-none" : ""}>
                <Card className={`group cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1 shadow-soft ${module.disabled ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-2 sm:pb-4 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 sm:p-3 rounded-lg ${module.color} shadow-soft ${module.disabled ? 'opacity-70' : ''}`}>
                        <module.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <Badge variant="outline" className={`text-xs hidden sm:inline-flex ${module.disabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        {module.disabled ? "Coming Soon" : "Open"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <CardTitle className={`text-sm sm:text-base md:text-lg mb-1 sm:mb-2 transition-colors line-clamp-1 ${module.disabled ? 'text-muted-foreground' : 'group-hover:text-primary'}`}>
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm line-clamp-2">{module.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>)}
          </div>
        </div>
      </section>
    </div>;
};
export default Dashboard;