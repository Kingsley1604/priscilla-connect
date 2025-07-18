import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { validateInput, sanitizeInput } from '@/lib/security';
import PrivacyNotice from '@/components/privacy/PrivacyNotice';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();

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
      
      if (!result.success) {
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
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
      <PrivacyNotice />
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <GraduationCap className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Priscilla Connect</h1>
          <p className="text-white/90">Sign in to your account</p>
        </div>

        <Card className="shadow-glow border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Welcome Back</CardTitle>
            <CardDescription className="text-white/80">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="text-center text-sm text-white/80">
                <p className="mb-2">Demo Accounts:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Student:</strong> student1 / demo123</p>
                  <p><strong>Teacher:</strong> teacher1 / demo123</p>
                  <p><strong>Admin:</strong> admin1 / demo123</p>
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