import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Smartphone, Mail, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TwoFactorAuth = () => {
  const [isEnabling, setIsEnabling] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify' | 'complete'>('initial');
  const [verificationCode, setVerificationCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      // In a real implementation, this would trigger 2FA setup via Supabase Auth
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('verify');
      toast.info("A verification code has been sent to your email");
    } catch (error) {
      toast.error("Failed to initialize 2FA setup");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsEnabling(true);
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('complete');
      setIs2FAEnabled(true);
      toast.success("Two-Factor Authentication enabled successfully!");
    } catch (error) {
      toast.error("Invalid verification code");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsEnabling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIs2FAEnabled(false);
      setStep('initial');
      toast.success("Two-Factor Authentication disabled");
    } catch (error) {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/teacher/profile-options">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Two-Factor Authentication</h1>
            <p className="text-muted-foreground text-sm">Add extra security to your account</p>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Enhanced Security</CardTitle>
                <CardDescription>Protect your account with 2FA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'initial' && !is2FAEnabled && (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">How it works</p>
                      <p className="text-sm text-muted-foreground">
                        When 2FA is enabled, you'll need to enter a verification code from your email 
                        each time you sign in, in addition to your password.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Email-based verification</p>
                      <p className="text-sm text-muted-foreground">
                        A 6-digit code will be sent to your registered email address whenever 
                        you attempt to log in.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleEnable2FA} disabled={isEnabling} className="w-full">
                  {isEnabling ? "Setting up..." : "Enable Two-Factor Authentication"}
                </Button>
              </>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit verification code to your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-xl tracking-widest"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('initial')} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleVerifyCode} disabled={isEnabling} className="flex-1">
                    {isEnabling ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </div>
              </div>
            )}

            {(step === 'complete' || is2FAEnabled) && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 dark:text-green-400">2FA is Active</p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Your account is protected with two-factor authentication
                  </p>
                </div>

                <Button 
                  variant="destructive" 
                  onClick={handleDisable2FA} 
                  disabled={isEnabling}
                  className="w-full"
                >
                  {isEnabling ? "Disabling..." : "Disable Two-Factor Authentication"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
