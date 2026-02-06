import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  lastLogin?: number;
  sector?: string;
  is_super_admin?: boolean;
  class_grade?: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  sessionId: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    sessionId: null,
    isLoading: true
  });

  const fetchUserProfile = useCallback(async (userId: string, session: Session) => {
    try {
      // Fetch profile data including sector, super admin status, and class_grade
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar, sector, is_super_admin, class_grade')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      if (roleData) {
        // Task B FIX: Explicitly check is_super_admin with proper boolean handling
        // Handle all falsy cases: null, undefined, false
        const isSuperAdmin = Boolean(profile?.is_super_admin);
        
        console.log('[useAuth] Profile data:', {
          userId,
          is_super_admin_raw: profile?.is_super_admin,
          isSuperAdmin_computed: isSuperAdmin,
          name: profile?.name,
          sector: profile?.sector,
          role: roleData.role,
          class_grade: profile?.class_grade
        });
        
        setAuthState({
          isAuthenticated: true,
          user: {
            id: userId,
            name: profile?.name || session.user.email || 'User',
            email: session.user.email || '',
            role: roleData.role as 'student' | 'teacher' | 'admin',
            avatar: profile?.avatar,
            lastLogin: Date.now(),
            sector: profile?.sector || undefined,
            is_super_admin: isSuperAdmin,
            class_grade: profile?.class_grade || null
          },
          session,
          sessionId: session.access_token,
          isLoading: false
        });
        
        // Debug log for super admin
        if (isSuperAdmin) {
          console.log('[useAuth] Super admin authenticated:', userId);
        }
      } else {
        // User exists but no role - might be during signup
        console.log('[useAuth] No role found for user:', userId);
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          sessionId: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        sessionId: null,
        isLoading: false
      });
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer profile fetch to avoid blocking/deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id, session);
        }, 0);
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          sessionId: null,
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
          sessionId: null,
          isLoading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // Task B: Real-time listener to kick out suspended users immediately
  useEffect(() => {
    if (!authState.user?.id) return;

    const channel = supabase
      .channel(`suspension-watch-${authState.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${authState.user.id}`
        },
        async (payload) => {
          const updatedProfile = payload.new as any;
          if (updatedProfile.is_suspended === true) {
            // Student has been suspended - force logout immediately
            console.log('[useAuth] Account suspended - forcing logout');
            await supabase.auth.signOut();
            setAuthState({
              isAuthenticated: false,
              user: null,
              session: null,
              sessionId: null,
              isLoading: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authState.user?.id]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password' };
        } else if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please verify your email before logging in' };
        }
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        await fetchUserProfile(data.user.id, data.session);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Force reset even on error
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null,
        sessionId: null,
        isLoading: false
      });
    }
  }, []);

  const updateActivity = useCallback(() => {
    // Activity tracking
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, lastLogin: Date.now() } : null
      }));
    }
  }, [authState.user]);

  return {
    ...authState,
    login,
    logout,
    updateActivity
  };
};
