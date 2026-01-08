import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import PrivacyNotice from '@/components/privacy/PrivacyNotice';
import SignupForm from './SignupForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Listen for auth changes to trigger re-render when logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Force page reload to update auth state everywhere
        window.location.reload();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (showSignup) {
    return <SignupForm onSwitchToLogin={() => setShowSignup(false)} />;
  }

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please try again.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Please verify your email before logging in.' });
        } else {
          setErrors({ general: error.message });
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user && data.session) {
        // Check user role and maintenance mode
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        const userRole = roleData?.role;
        
        // Get profile for super admin check
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, is_super_admin, sector')
          .eq('id', data.user.id)
          .single();
        
        // Check maintenance mode from database
        const { data: maintenanceData } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode')
          .single();

        const maintenanceMode = maintenanceData?.setting_value === 'true';
        const isSuperAdmin = profileData?.is_super_admin === true;

        // Super admins can always login, even during maintenance
        if (maintenanceMode && userRole !== 'admin' && !isSuperAdmin) {
          // Sign them out and show error
          await supabase.auth.signOut();
          setErrors({ general: 'System is under maintenance. Please try again later.' });
          setIsSubmitting(false);
          return;
        }

        // Send login notification to super admin
        await sendLoginNotification(data.user.id, profileData?.name || data.user.email || 'Unknown User');

        toast.success('Login successful!');
        // The onAuthStateChange listener will handle the redirect
      }
    } catch (error: any) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
    }
  };

  // Function to send login notification with device/location info
  const sendLoginNotification = async (userId: string, userName: string) => {
    try {
      // Detect device
      const userAgent = navigator.userAgent;
      let device = 'Unknown Device';
      if (/Android/i.test(userAgent)) device = 'Android Device';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) device = 'iOS Device';
      else if (/Windows/i.test(userAgent)) device = 'Windows PC';
      else if (/Macintosh/i.test(userAgent)) device = 'Mac';
      else if (/Linux/i.test(userAgent)) device = 'Linux PC';

      // Get approximate location from IP
      let location = 'Location unavailable';
      try {
        const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        if (data.city && data.country_name) {
          location = `${data.city}, ${data.country_name}`;
        }
      } catch {
        // Location unavailable
      }

      // Insert notification to admin_notifications table
      await supabase.from('admin_notifications').insert({
        title: 'User Login',
        message: `${userName} logged in from ${device} at ${location}. Time: ${new Date().toLocaleString()}`,
        type: 'login'
      });
    } catch (error) {
      // Silent fail - don't block login for notification errors
      if (import.meta.env.DEV) {
        console.error('Error sending login notification:', error);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 sm:px-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <PrivacyNotice />
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-white/20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm">
            <img src={priscillaLogo} alt="Priscilla Connect" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Priscilla Connect</h1>
          <p className="text-white/90 text-sm sm:text-base">Sign in to your account</p>
        </div>

        <Card className="shadow-glow border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-white/80 text-sm">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {errors.general && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-white">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                  placeholder="Enter your email"
                  autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-300">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-300">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-primary hover:bg-white/90 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                Forgot your password?
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-sm text-white/80 mb-4">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="text-white hover:underline font-medium"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </div>

            {/* Forgot Password Dialog */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                      Enter your email and we'll send you a reset link. 
                      <br />
                      <span className="text-amber-600 text-xs">Note: Teachers should contact school admin for password reset.</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleForgotPassword}
                        disabled={isResettingPassword}
                        className="flex-1"
                      >
                        {isResettingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
