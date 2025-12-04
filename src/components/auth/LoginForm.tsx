import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { validateInput, sanitizeInput } from '@/lib/security';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import PrivacyNotice from '@/components/privacy/PrivacyNotice';
import SignupForm from './SignupForm';
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  
  const { login } = useAuth();
  const { sendAdminNotification, detectDevice, detectLocation } = useNotifications();

  if (showSignup) {
    return <SignupForm onSwitchToLogin={() => setShowSignup(false)} />;
  }

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (credentials.username.length > 50) {
      newErrors.username = 'Username is too long';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (credentials.password.length > 100) {
      newErrors.password = 'Password is too long';
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
      // Sanitize inputs
      const sanitizedUsername = sanitizeInput.username(credentials.username);
      const sanitizedPassword = credentials.password; // Don't sanitize password, just validate length
      
      const result = await login(sanitizedUsername, sanitizedPassword);
      
      if (result.success) {
        // Send admin notification about login
        const device = detectDevice();
        const location = await detectLocation();
        
        sendAdminNotification({
          type: 'login',
          message: `User ${sanitizedUsername} logged in successfully`,
          username: sanitizedUsername,
          device,
          location,
          severity: 'low'
        });
      } else {
        setErrors({ general: result.error || 'Login failed' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'username' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error on change
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
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleInputChange('username')}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                  placeholder="Enter your username"
                  maxLength={50}
                  autoComplete="username"
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
                {errors.username && (
                  <p id="username-error" className="text-sm text-red-300">
                    {errors.username}
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
                    maxLength={100}
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
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

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
                
                <div className="text-sm text-white/80">
                  <p className="mb-2">Demo Accounts:</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Student:</strong> student1 / demo123</p>
                    <p><strong>Teacher:</strong> teacher1 / demo123</p>
                    <p><strong>Admin:</strong> admin1 / demo123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;