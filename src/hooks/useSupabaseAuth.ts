import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    isLoading: true
  });

  const fetchUserProfile = useCallback(async (userId: string, session: Session) => {
    try {
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar')
        .eq('id', userId)
        .single();

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setAuthState({
          isAuthenticated: true,
          user: {
            id: userId,
            name: profile?.name || session.user.email || 'User',
            email: session.user.email || '',
            role: roleData.role as 'student' | 'teacher' | 'admin',
            avatar: profile?.avatar
          },
          session,
          isLoading: false
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          isLoading: false
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching user profile:', error);
      }
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false
      });
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer profile fetch to avoid blocking
        setTimeout(() => {
          fetchUserProfile(session.user.id, session);
        }, 0);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          isLoading: false
        });
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          isLoading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        await fetchUserProfile(data.user.id, data.session);
      }

      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
      return { success: false, error: 'An error occurred during login' };
    }
  }, [fetchUserProfile]);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create profile if user was created
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          name
        });
      }

      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Signup error:', error);
      }
      return { success: false, error: 'An error occurred during signup' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        isLoading: false
      });
      window.location.href = '/';
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
    }
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout,
  };
};