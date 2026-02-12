import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import Landing from "@/pages/Landing";
import RoleLoginForm from "@/components/auth/RoleLoginForm";
import StudentSignupForm from "@/components/auth/StudentSignupForm";
import AdminSignupForm from "@/components/auth/AdminSignupForm";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import priscillaLogo from "@/assets/priscilla-connect-logo.svg";

type AuthView = 'landing' | 'login' | 'signup';

const Index = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin' | null>(null);
  const [authView, setAuthView] = useState<AuthView>('landing');

  // Set role from authenticated user
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      setSelectedRole(user.role);
    }
  }, [isAuthenticated, user?.role]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-sm animate-pulse">
            <img src={priscillaLogo} alt="Priscilla Connect" className="h-16 w-16 object-cover" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto bg-white/20" />
          <Skeleton className="h-4 w-32 mx-auto bg-white/20" />
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated && user) {
    return (
      <Dashboard 
        userRole={user.role} 
        userName={user.name}
        userAvatar={user.avatar}
        onLogout={logout}
      />
    );
  }

  // Handle role selection from landing page
  const handleSelectRole = (role: 'student' | 'teacher' | 'admin') => {
    setSelectedRole(role);
    setAuthView('login');
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedRole(null);
    setAuthView('landing');
  };

  // Handle switch to signup
  const handleSwitchToSignup = () => {
    setAuthView('signup');
  };

  // Handle switch to login
  const handleSwitchToLogin = () => {
    setAuthView('login');
  };

  // Show landing page
  if (authView === 'landing' || !selectedRole) {
    return <Landing onSelectRole={handleSelectRole} />;
  }

  // Show signup form
  if (authView === 'signup' && selectedRole) {
    if (selectedRole === 'student') {
      return (
        <StudentSignupForm 
          onBack={handleBack}
          onSwitchToLogin={handleSwitchToLogin}
        />
      );
    }
    if (selectedRole === 'admin') {
      return (
        <AdminSignupForm 
          onBack={handleBack}
          onSwitchToLogin={handleSwitchToLogin}
        />
      );
    }
    // Teachers can't sign up
    setAuthView('login');
  }

  // Show login form
  if (authView === 'login' && selectedRole) {
    return (
      <RoleLoginForm 
        role={selectedRole}
        onBack={handleBack}
        onSwitchToSignup={selectedRole !== 'teacher' ? handleSwitchToSignup : undefined}
      />
    );
  }

  return <Landing onSelectRole={handleSelectRole} />;
};

export default Index;
