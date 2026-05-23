import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AdminNotificationSystem from "@/components/notifications/AdminNotificationSystem";
import UnifiedNotifications from "@/components/notifications/UnifiedNotifications";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import StudentDashboardWidget from "@/components/student/StudentDashboardWidget";
import SystemHealthCard from "@/components/dashboard/SystemHealthCard";
import HelpWidget from "@/components/help/HelpWidget";
import { BookOpen, Users, Trophy, Calendar, MessageSquare, BarChart3, Bell, Settings, PlayCircle, Brain, Package, FileText, GamepadIcon, ShoppingBag, Menu, X, User, LogOut, Moon, UserX, GraduationCap, ClipboardList, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link, useNavigate } from "react-router-dom";
import priscillaLogo from "@/assets/priscilla-connect-logo.svg";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { isExamPrepEligible as checkExamPrepEligible } from "@/lib/examPrepEligibility";
interface DashboardProps {
  userRole: 'student' | 'teacher' | 'admin';
  userName: string;
  userAvatar?: string;
  onLogout?: () => void;
  isSuperAdmin?: boolean;
}
const Dashboard = ({
  userRole,
  userName,
  userAvatar,
  onLogout,
  isSuperAdmin
}: DashboardProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user: authUser } = useAuth();
  
  // Check if user is super admin from auth context or props
  const isUserSuperAdmin = isSuperAdmin || authUser?.is_super_admin;
  
  // Task J: Check if student is assigned to a class
  const studentClassGrade = (authUser as any)?.class_grade;
  const isUnassignedStudent = userRole === 'student' && (!studentClassGrade || studentClassGrade === '');

  // Exam Prep is only for SS1-SS3 students.
  const isExamPrepEligible = checkExamPrepEligible(
    userRole,
    (authUser as any)?.sector,
    studentClassGrade,
    isUserSuperAdmin,
  );
  
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
      description: "Take School Examination",
      icon: FileText,
      color: "bg-gradient-primary",
      path: "/student/exam"
    }, {
      title: "Exam Prep",
      description: "Practice External Exams",
      icon: GraduationCap,
      color: "bg-gradient-accent",
      path: "/student/exam-prep"
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
      title: "Manage Examination",
      description: "Approve, decline, or unpublish exams",
      icon: FileText,
      color: "bg-gradient-primary",
      path: "/admin/manage-examination"
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
    
    // Add super admin modules
    const superAdminModules: Array<{
      title: string;
      description: string;
      icon: any;
      color: string;
      path: string;
      disabled?: boolean;
    }> = [{
      title: "Manage Admins",
      description: "Manage all admin accounts",
      icon: Shield,
      color: "bg-gradient-to-r from-purple-600 to-indigo-600",
      path: "/admin/manage-admins"
    }, {
      title: "Super Admin Panel",
      description: "System-wide controls",
      icon: Shield,
      color: "bg-gradient-to-r from-indigo-600 to-purple-600",
      path: "/admin/super-admin"
    }];
    if (userRole === 'student') {
      const filteredStudent = isExamPrepEligible
        ? studentModules
        : studentModules.filter((m) => m.path !== '/student/exam-prep');
      return [...baseModules, ...filteredStudent];
    }
    if (userRole === 'teacher') return [...baseModules, ...teacherModules];
    // Admin modules with super admin modules if applicable
    const adminAllModules = isUserSuperAdmin 
      ? [...baseModules, ...superAdminModules, ...adminModules]
      : [...baseModules, ...adminModules];
    return adminAllModules;
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
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[72px] sm:h-[104px]" />
      
      {/* Header - Task A: Fixed position for dashboard heading */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-hero text-white py-3 sm:py-6 px-3 sm:px-6 shadow-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <div className="rounded-lg backdrop-blur-sm flex-shrink-0 overflow-hidden p-0 m-0">
              <img src={priscillaLogo} alt="Priscilla Connect" className="h-10 w-10 sm:h-14 sm:w-14 block m-0 p-0 object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl md:text-3xl font-bold truncate">Priscilla Connect</h1>
              <p className="text-white/90 text-[10px] sm:text-sm md:text-base truncate">Empowering Education Together</p>
            </div>
          </div>
          
          {/* Desktop Navigation - Completely hidden on mobile screens */}
          <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <div className="hidden sm:block">
              {userRole === 'student' && <UnifiedNotifications userRole="student" />}
              {userRole === 'teacher' && <UnifiedNotifications userRole="teacher" />}
              {userRole === 'admin' && <AdminNotificationSystem />}
            </div>
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
                    <AlertDialogAction onClick={onLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, I do want to leave</AlertDialogAction>
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
                  
                  {/* Task B: Mobile notifications - unified for all users */}
                  {(userRole === 'admin' || userRole === 'teacher' || userRole === 'student') && (
                    <div className="px-4 py-3 border-t border-b">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Notifications</span>
                        {userRole === 'admin' ? <AdminNotificationSystem /> : <UnifiedNotifications userRole={userRole} />}
                      </div>
                    </div>
                  )}
                  
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5" />
                      <span className="font-medium">Night Mode</span>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  <div className="border-t my-2" />
                  
                  {onLogout && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Logout</span>
                        </button>
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
                          <AlertDialogAction onClick={() => {
                            setMobileMenuOpen(false);
                            onLogout();
                          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, I do want to leave</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Welcome Section - Task M: Mobile responsiveness fix */}
      <section className="py-3 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 truncate px-2">
              Welcome back, {userName.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-xs sm:text-base">
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

      {/* Modules Grid - Task M: Mobile responsiveness fix */}
      <section className="pb-6 sm:pb-10 md:pb-12 px-3 sm:px-4 md:px-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm sm:text-lg md:text-xl font-semibold mb-3 sm:mb-6 text-foreground">Your Dashboard</h3>
          
          {/* Task J: Show warning for unassigned students */}
          {isUnassignedStudent && (
            <Card className="mb-6 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">Not Assigned to a Class</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Please wait for your class teacher to assign you to a class. Most features are currently restricted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {modules.map((module, index) => {
              // Task J: Restrict features for unassigned students (except Calendar)
              const isRestricted = isUnassignedStudent && module.title !== 'Calendar';
              const modulePath = isRestricted ? "#" : (module.disabled ? "#" : module.path || "#");
              const isDisabled = module.disabled || isRestricted;
              
              return (
                <Link 
                  key={module.title} 
                  to={modulePath} 
                  className={isDisabled ? "pointer-events-none" : ""}
                  onClick={(e) => {
                    if (isRestricted) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Card className={`group cursor-pointer hover:shadow-medium transition-all duration-300 hover:-translate-y-1 shadow-soft ${isDisabled ? 'opacity-60' : ''} h-full`}>
                    <CardHeader className="pb-1 sm:pb-4 p-2 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 sm:p-3 rounded-lg ${module.color} shadow-soft ${isDisabled ? 'opacity-70' : ''}`}>
                          <module.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                        </div>
                        <Badge variant="outline" className={`text-[10px] sm:text-xs hidden sm:inline-flex ${isDisabled ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          {isRestricted ? "Restricted" : (module.disabled ? "Coming Soon" : "Open")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4 pt-0">
                      <CardTitle className={`text-xs sm:text-base md:text-lg mb-0.5 sm:mb-2 transition-colors line-clamp-1 ${isDisabled ? 'text-muted-foreground' : 'group-hover:text-primary'}`}>
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-sm line-clamp-2">
                        {isRestricted ? "Available after class assignment" : module.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Task B: Help Widget - AI & Human Support */}
      <HelpWidget />
    </div>;
};
export default Dashboard;
