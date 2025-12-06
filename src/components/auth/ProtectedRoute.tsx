import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from './LoginForm';
import { Skeleton } from '@/components/ui/skeleton';
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher' | 'admin';
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, requiredRole, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, updateActivity } = useAuth();

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity();
      }
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // Show loading with logo
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return fallback || <LoginForm />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
        <div className="max-w-md mx-auto text-center text-white">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-white/80 mb-6">
            You don't have permission to access this resource. 
            This area is restricted to {requiredRole}s only.
          </p>
          <p className="text-sm text-white/60">
            Current role: {user?.role || 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
