import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, GraduationCap, Users, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import PrivacyNotice from '@/components/privacy/PrivacyNotice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useLoginNotification } from '@/hooks/useLoginNotification';
import priscillaLogo from "@/assets/priscilla-connect-logo.svg";

interface RoleLoginFormProps {
  role: 'student' | 'teacher' | 'admin';
  onBack: () => void;
  onSwitchToSignup?: () => void;
}

// Demo credentials for each role
const demoCredentials = {
  student: { email: 'demo.student@priscilla.edu', password: 'Demo@Student2025' },
  teacher: { email: 'demo.teacher@priscilla.edu', password: 'Demo@Teacher2025' },
  admin: { email: 'demo.admin@priscilla.edu', password: 'Demo@Admin2025' },
};

const roleConfig = {
  student: {
    title: 'Student Portal',
    description: 'Access your academic dashboard',
    icon: GraduationCap,
    color: 'from-pink-500 to-pink-600',
    canSignUp: true,
  },
  teacher: {
    title: 'Teacher Dashboard',
    description: 'Manage your classes and content',
    icon: Users,
    color: 'from-gray-500 to-gray-600',
    canSignUp: false,
  },
  admin: {
    title: 'Admin Panel',
    description: 'System administration access',
    icon: Settings,
    color: 'from-pink-600 to-pink-700',
    canSignUp: true,
  },
};

const RoleLoginForm = ({ role, onBack, onSwitchToSignup }: RoleLoginFormProps) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { sendLoginNotification } = useLoginNotification();
  const config = roleConfig[role];
  const Icon = config.icon;

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
        } else if (error.message.includes('User is banned')) {
          setErrors({ general: 'Your account has been banned by an administrator.' });
        } else {
          setErrors({ general: error.message });
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user && data.session) {
        // Verify the user has the correct role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleError || !roleData) {
          setErrors({ general: 'Unable to verify your account role. Please contact support.' });
          await supabase.auth.signOut();
          setIsSubmitting(false);
          return;
        }

        if (roleData.role !== role) {
          setErrors({ general: `This account is not registered as a ${role}. Please select the correct role.` });
          await supabase.auth.signOut();
          setIsSubmitting(false);
          return;
        }

        // Task B: Check if the student account is suspended
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_suspended, is_super_admin, name')
          .eq('id', data.user.id)
          .single();

        if (profileData?.is_suspended) {
          await supabase.auth.signOut();
          setErrors({ general: 'Your account has been suspended. Please contact your class teacher or school administrator.' });
          setIsSubmitting(false);
          return;
        }

        // Check maintenance mode - block all users except super admin
        const { data: maintenanceData } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'maintenance_mode')
          .single();

        if (maintenanceData?.setting_value === 'true') {
          if (!profileData?.is_super_admin) {
            await supabase.auth.signOut();
            setErrors({ general: 'Priscilla Connect SMS is currently under maintenance. Please try again later.' });
            setIsSubmitting(false);
            return;
          }
        }

        // Task D&E: Send login notification to super admin
        sendLoginNotification(data.user.id, profileData?.name || data.user.email || 'User');

        toast.success('Login successful!');
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
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
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <PrivacyNotice />
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center rounded-full mb-4 sm:mb-6 backdrop-blur-sm overflow-hidden p-0 m-0">
            <img src={priscillaLogo} alt="Priscilla Connect" className="h-20 w-20 sm:h-24 sm:w-24 block m-0 p-0 object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Priscilla Connect</h1>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.color} text-white text-sm font-medium`}>
            <Icon className="h-4 w-4" />
            {config.title}
          </div>
        </div>

        <Card className="shadow-glow border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-white/80 text-sm">
              {config.description}
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

              {/* Forgot Password Link - Only for admin and student */}
              {role !== 'teacher' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-white/80 hover:text-white hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
              
              {role === 'teacher' && (
                <div className="text-center">
                  <p className="text-sm text-white/60">
                    Forgot password? Contact your administrator.
                  </p>
                </div>
              )}

            </form>

            {config.canSignUp && onSwitchToSignup && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-sm text-white/80 mb-4">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToSignup}
                      className="text-white hover:underline font-medium"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            )}

            {!config.canSignUp && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-sm text-white/70 text-center">
                  Teacher accounts are created by administrators. Contact your school admin if you need access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleLoginForm;
