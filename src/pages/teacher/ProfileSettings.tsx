import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Save, Mail, Phone, MapPin, Calendar, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    teacher_id: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        name: profileData?.name || '',
        email: user.email || '',
        phone: profileData?.phone || '',
        department: profileData?.department || '',
        teacher_id: profileData?.teacher_id || '',
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);
    try {
      // Verify current password first by re-authenticating
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) {
        toast.error("Unable to verify user session");
        setIsSaving(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: passwordData.currentPassword
      });

      if (verifyError) {
        toast.error("Current password is incorrect");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Update must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }

      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background p-responsive">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-responsive-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground text-responsive-sm">Manage your personal information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-responsive">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-responsive-lg">Profile Picture</CardTitle>
                <CardDescription className="text-responsive-sm">Update your profile photo</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <Button variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                
                <div className="text-center pt-4 border-t">
                  <h3 className="font-semibold text-responsive-base">{profile.name}</h3>
                  <p className="text-muted-foreground text-responsive-sm">Teacher</p>
                  {profile.teacher_id && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ID: {profile.teacher_id}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="shadow-soft mt-4 sm:mt-6">
              <CardHeader>
                <CardTitle className="text-responsive-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription className="text-responsive-sm">Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                {!showPasswordSection ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-responsive-sm">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-responsive-sm">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePasswordChange} 
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? "Saving..." : "Update Password"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPasswordSection(false);
                          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-responsive-lg">Personal Information</CardTitle>
                <CardDescription className="text-responsive-sm">Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-responsive">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-responsive-sm">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-responsive-sm">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-responsive-sm">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="pl-10"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-responsive-sm">Department</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="E.g., Science Department"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
                  <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;