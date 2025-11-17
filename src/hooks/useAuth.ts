import { useState, useEffect, useCallback } from 'react';
import { validateInput, sessionSecurity, auditLog, rateLimiting } from '@/lib/security';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  lastLogin: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  sessionId: string | null;
  isLoading: boolean;
}

// Mock user database for demo purposes
const mockUsers: Record<string, User & { password: string }> = {
  'student1': {
    id: 'STU001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    role: 'student',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c4bb2108?w=150&h=150&fit=crop&crop=face',
    lastLogin: Date.now()
  },
  'teacher1': {
    id: 'TCH001', 
    name: 'Mr. David Thompson',
    email: 'david.thompson@school.edu',
    role: 'teacher',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    lastLogin: Date.now()
  },
  'admin1': {
    id: 'ADM001',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@school.edu', 
    role: 'admin',
    password: 'demo123',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    lastLogin: Date.now()
  }
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    sessionId: null,
    isLoading: true
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedSession = localStorage.getItem('priscilla_session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          
          // Validate session
          if (session.sessionId && session.userId && sessionSecurity.isSessionValid(session.lastActivity)) {
            const user = Object.values(mockUsers).find(u => u.id === session.userId);
            if (user && validateInput.role(session.role)) {
              setAuthState({
                isAuthenticated: true,
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  avatar: user.avatar,
                  lastLogin: user.lastLogin
                },
                sessionId: session.sessionId,
                isLoading: false
              });
              
              // Update last activity
              session.lastActivity = Date.now();
              localStorage.setItem('priscilla_session', JSON.stringify(session));
              return;
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        auditLog.log('AUTH_INIT_ERROR', 'system', { error: error.message });
      }
      
      // Clear invalid session
      localStorage.removeItem('priscilla_session');
      setAuthState({
        isAuthenticated: false,
        user: null,
        sessionId: null,
        isLoading: false
      });
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check
      if (rateLimiting.isRateLimited(username)) {
        auditLog.log('LOGIN_RATE_LIMITED', username);
        return { success: false, error: 'Too many login attempts. Please try again later.' };
      }

      // Input validation
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }

      if (username.length > 50 || password.length > 100) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find user
      const user = mockUsers[username];
      if (!user || user.password !== password) {
        rateLimiting.recordAttempt(username);
        auditLog.log('LOGIN_FAILED', username, { reason: 'invalid_credentials' });
        return { success: false, error: 'Invalid username or password' };
      }

      // Create secure session
      const session = sessionSecurity.createSession(user.id, user.role);
      
      // Store session securely
      localStorage.setItem('priscilla_session', JSON.stringify(session));

      // Update auth state
      setAuthState({
        isAuthenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          lastLogin: Date.now()
        },
        sessionId: session.sessionId,
        isLoading: false
      });

      // Clear rate limiting on successful login
      rateLimiting.loginAttempts.delete(username);
      
      auditLog.log('LOGIN_SUCCESS', user.id, { role: user.role });
      
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      auditLog.log('LOGIN_ERROR', username, { error: error.message });
      return { success: false, error: 'An error occurred during login' };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      if (authState.user) {
        auditLog.log('LOGOUT', authState.user.id);
      }
      
      // Clear session
      localStorage.removeItem('priscilla_session');
      
      // Reset auth state
      setAuthState({
        isAuthenticated: false,
        user: null,
        sessionId: null,
        isLoading: false
      });
      
      // Navigate to home page
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      auditLog.log('LOGOUT_ERROR', authState.user?.id || 'unknown', { error: error.message });
    }
  }, [authState.user]);

  const updateActivity = useCallback(() => {
    if (authState.isAuthenticated && authState.sessionId) {
      try {
        const storedSession = localStorage.getItem('priscilla_session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          session.lastActivity = Date.now();
          localStorage.setItem('priscilla_session', JSON.stringify(session));
        }
      } catch (error) {
        console.error('Activity update error:', error);
      }
    }
  }, [authState.isAuthenticated, authState.sessionId]);

  // Session timeout check
  useEffect(() => {
    if (authState.isAuthenticated) {
      const interval = setInterval(() => {
        const storedSession = localStorage.getItem('priscilla_session');
        if (storedSession) {
          try {
            const session = JSON.parse(storedSession);
            if (!sessionSecurity.isSessionValid(session.lastActivity)) {
              auditLog.log('SESSION_TIMEOUT', authState.user?.id || 'unknown');
              logout();
            }
          } catch (error) {
            console.error('Session check error:', error);
            logout();
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [authState.isAuthenticated, authState.user?.id, logout]);

  return {
    ...authState,
    login,
    logout,
    updateActivity
  };
};