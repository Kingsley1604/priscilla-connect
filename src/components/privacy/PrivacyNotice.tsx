import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Cookie, Eye, FileText } from 'lucide-react';

const PrivacyNotice = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    // Check if user has already accepted privacy notice
    const accepted = localStorage.getItem('priscilla_privacy_accepted');
    if (!accepted) {
      setIsVisible(true);
    } else {
      setHasAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('priscilla_privacy_accepted', 'true');
    setHasAccepted(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    // In a real app, this would redirect away or disable functionality
    alert('You must accept the privacy policy to use this educational platform.');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Privacy & Data Protection</CardTitle>
              <CardDescription>
                Your privacy is important to us at Priscilla Connect
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Cookie className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Essential Cookies Only</h4>
                <p className="text-sm text-muted-foreground">
                  We use only essential cookies for authentication and session management. 
                  No tracking or advertising cookies are used.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">Data Collection</h4>
                <p className="text-sm text-muted-foreground">
                  We collect only necessary educational data: name, email, role, and academic progress. 
                  All data is encrypted and stored securely.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1">FERPA Compliance</h4>
                <p className="text-sm text-muted-foreground">
                  As an educational platform, we comply with FERPA regulations to protect 
                  student educational records and maintain privacy standards.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-primary" />
              Your Rights
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Access your personal data</li>
              <li>• Request data correction or deletion</li>
              <li>• Withdraw consent at any time</li>
              <li>• Data portability upon request</li>
            </ul>
          </div>

          <div className="flex items-center justify-between space-x-3">
            <Badge variant="outline" className="text-xs">
              GDPR Compliant
            </Badge>
            <Badge variant="outline" className="text-xs">
              FERPA Compliant
            </Badge>
            <Badge variant="outline" className="text-xs">
              SOC 2 Type II
            </Badge>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDecline}
            >
              Decline
            </Button>
            <Button 
              className="flex-1"
              onClick={handleAccept}
            >
              Accept & Continue
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By accepting, you agree to our Privacy Policy and Terms of Service.
            Contact privacy@priscillaconnect.edu for questions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyNotice;