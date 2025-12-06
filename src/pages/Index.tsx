import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

const Index = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin' | null>(null);

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
            <img src={priscillaLogo} alt="Priscilla Connect" className="h-16 w-16 object-contain" />
          </div>
          <Skeleton className="h-8 w-48 mx-auto bg-white/20" />
          <Skeleton className="h-4 w-32 mx-auto bg-white/20" />
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Set role if authenticated but no role selected
  if (!selectedRole && user?.role) {
    return (
      <Dashboard 
        userRole={user.role} 
        userName={user.name}
        userAvatar={user.avatar}
        onLogout={logout}
      />
    );
  }

  // Dashboard view for authenticated user
  return (
    <Dashboard 
      userRole={selectedRole || user?.role || 'student'} 
      userName={user?.name || 'User'}
      userAvatar={user?.avatar}
      onLogout={logout}
    />
  );
};

export default Index;
