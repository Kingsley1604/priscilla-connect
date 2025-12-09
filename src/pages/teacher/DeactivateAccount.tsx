import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertTriangle, Power } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DeactivateAccount = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeactivate = async () => {
    if (confirmText !== "DEACTIVATE") {
      toast.error("Please type DEACTIVATE to confirm");
      return;
    }

    if (!password) {
      toast.error("Please enter your password to confirm");
      return;
    }

    setIsDeactivating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Verify password by re-authenticating
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      });

      if (authError) {
        toast.error("Incorrect password");
        setIsDeactivating(false);
        return;
      }

      // Update profile to mark as deactivated (soft delete)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_profile_complete: false,
          // We could add a deactivated_at field in a real implementation
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Sign out
      await supabase.auth.signOut();
      
      toast.success("Your account has been deactivated. Contact admin to reactivate.");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Deactivate Account</h1>
            <p className="text-muted-foreground text-sm">Temporarily disable your account</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Deactivating your account will log you out and prevent access 
            to all school resources. Contact an administrator to reactivate your account.
          </AlertDescription>
        </Alert>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500">
                <Power className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Account Deactivation</CardTitle>
                <CardDescription>This action can be reversed by an administrator</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">What happens when you deactivate:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You will be immediately logged out</li>
                  <li>• You won't be able to sign in until reactivated</li>
                  <li>• Your data will be preserved</li>
                  <li>• Students won't be able to see your content</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Type DEACTIVATE to confirm</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DEACTIVATE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Enter your password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                />
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={confirmText !== "DEACTIVATE" || !password}
                >
                  Deactivate My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately log you out and disable your account. 
                    You will need to contact an administrator to regain access.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeactivate}
                    disabled={isDeactivating}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeactivating ? "Deactivating..." : "Yes, Deactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeactivateAccount;
