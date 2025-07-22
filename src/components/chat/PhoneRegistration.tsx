import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, CheckCircle, AlertTriangle } from 'lucide-react';

interface PhoneRegistrationProps {
  onRegistrationComplete: (phoneNumber: string) => void;
}

const PhoneRegistration = ({ onRegistrationComplete }: PhoneRegistrationProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    setError('');

    // Simulate phone verification API call
    setTimeout(() => {
      if (phoneNumber.length < 10) {
        setError('Please enter a valid phone number');
        setIsLoading(false);
        return;
      }
      
      setStep('verification');
      setIsLoading(false);
    }, 1500);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setIsLoading(true);
    setError('');

    // Simulate verification code check
    setTimeout(() => {
      if (verificationCode !== '123456') {
        setError('Invalid verification code. Try "123456" for demo');
        setIsLoading(false);
        return;
      }
      
      onRegistrationComplete(phoneNumber);
    }, 1000);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Welcome to PriscillaChat' : 'Verify Your Number'}
          </CardTitle>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Enter your phone number to get started'
              : `We sent a code to ${phoneNumber}`
            }
          </p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  className="text-center text-lg"
                  maxLength={12}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" 
                disabled={!phoneNumber.trim() || isLoading}
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" 
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep('phone')}
              >
                Change Phone Number
              </Button>
            </form>
          )}

          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo:</strong> Use any phone number and verification code "123456"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneRegistration;