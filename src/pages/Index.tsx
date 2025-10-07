import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

const Index = () => {
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin' | null>(null);

  // If user is authenticated, use their role, otherwise show role selection
  if (!selectedRole && user) {
    setSelectedRole(user.role);
  }

  // Role selection screen (for demo purposes - in production, role comes from auth)
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
              <img src={priscillaLogo} alt="Priscilla Connect" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Priscilla Connect</h1>
            <p className="text-xl text-white/90 mb-8">
              Empowering Education Through Technology
            </p>
            <p className="text-white/80 mb-12 max-w-2xl mx-auto">
              A comprehensive school management system designed to connect students, teachers, and administrators in a seamless educational experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm border-white/20"
              onClick={() => setSelectedRole('student')}
            >
              <CardHeader className="pb-4">
                <div className="mx-auto bg-gradient-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Student Portal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm">
                  Access your reports, homework assistant, educational videos, and achievements.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm border-white/20"
              onClick={() => setSelectedRole('teacher')}
            >
              <CardHeader className="pb-4">
                <div className="mx-auto bg-gradient-secondary p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Teacher Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm">
                  Manage classes, track student performance, and upload educational content.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-glow transition-all duration-300 hover:-translate-y-2 bg-white/10 backdrop-blur-sm border-white/20"
              onClick={() => setSelectedRole('admin')}
            >
              <CardHeader className="pb-4">
                <div className="mx-auto bg-gradient-accent p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <img src={priscillaLogo} alt="Admin" className="h-8 w-8 object-contain" />
                </div>
                <CardTitle className="text-white text-xl">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm">
                  Oversee school operations, manage users, and configure system settings.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-white/70 text-sm">
            Select your role to explore the Priscilla Connect experience
          </p>
        </div>
      </div>
    );
  }

  // Dashboard view
  const getUserName = () => {
    if (user) return user.name;
    if (selectedRole === 'student') return 'Sarah Johnson';
    if (selectedRole === 'teacher') return 'Mr. David Thompson';
    return 'Dr. Emily Rodriguez';
  };

  const getUserAvatar = () => {
    if (user) return user.avatar;
    return `https://images.unsplash.com/photo-${selectedRole === 'student' ? '1494790108755-2616c4bb2108' : selectedRole === 'teacher' ? '1507003211169-0a1dd7228f2d' : '1573496359142-b8d87734a5a2'}?w=150&h=150&fit=crop&crop=face`;
  };

  return (
    <ProtectedRoute>
      <div className="relative">
        <Dashboard 
          userRole={selectedRole} 
          userName={getUserName()}
          userAvatar={getUserAvatar()}
          onLogout={logout}
        />
        
        {/* Back button - only show if not authenticated (demo mode) */}
        {!user && (
          <Button 
            variant="ghost" 
            className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => setSelectedRole(null)}
          >
            ← Back to Role Selection
          </Button>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Index;
