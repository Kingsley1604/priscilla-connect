import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Lock, ArrowLeft, Settings, Building } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import priscillaLogo from "@/assets/priscilla-connect-main-logo.png";

interface AdminSignupFormProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
}

const departments = [
  'Academic & Student Affairs',
  'Administration & Operations',
  'Information Technology Department',
];

const AdminSignupForm = ({ onBack, onSwitchToLogin }: AdminSignupFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validation
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      setIsLoading(false);
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!formData.department) {
      setError('Please select your department');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms and Conditions and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      // Sign up the admin user
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.fullName.trim(),
            role: 'admin',
            department: formData.department
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signupError) {
        if (signupError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(signupError.message);
        }
        setIsLoading(false);
        return;
      }
      
      if (!data.user) {
        setError('Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      // Update the user role to admin (the trigger creates student by default)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', data.user.id);

      if (roleError) {
        console.error('Failed to update role to admin:', roleError);
      }

      // Update profile with department
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          department: formData.department,
          name: formData.fullName.trim()
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Failed to update profile:', profileError);
      }

      if (data.session) {
        toast.success("Admin account created successfully!");
        navigate('/dashboard');
      } else {
        setSuccessMessage("Account created! Please check your email to verify your account, then sign in.");
        toast.success("Account created! Please check your email to verify your account.");
      }
      
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 sm:px-6 py-8">
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
      
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-white/20 rounded-full mb-4 sm:mb-6 backdrop-blur-sm">
            <img src={priscillaLogo} alt="Priscilla Connect" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Priscilla Connect</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-pink-700 text-white text-sm font-medium">
            <Settings className="h-4 w-4" />
            Admin Registration
          </div>
        </div>

        <Card className="shadow-glow border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Create Admin Account</CardTitle>
            <CardDescription className="text-white/80 text-sm">
              Register as a school administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {successMessage ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center p-4 bg-green-500/20 rounded-full mb-4">
                  <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white mb-4">{successMessage}</p>
                <Button
                  onClick={onSwitchToLogin}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-white">Department *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 z-10" />
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger className="pl-10 bg-white/20 border-white/30 text-white focus:bg-white/30">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                    className="mt-1 border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
                  />
                  <Label htmlFor="terms" className="text-sm text-white/90 leading-normal cursor-pointer">
                    I agree to the Terms and Conditions and Privacy Policy *
                  </Label>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-white">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-white text-primary hover:bg-white/90 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-sm text-white/80">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="text-white hover:underline font-medium"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignupForm;
