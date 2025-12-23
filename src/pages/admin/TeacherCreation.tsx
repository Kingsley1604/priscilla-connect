import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TeacherCreation = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<{
    teacherId: string;
    password: string;
    email: string;
    name: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create the teacher user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: 'temp_password_' + Math.random().toString(36).slice(2), // Temporary password
        options: {
          data: {
            name: formData.fullName,
            role: 'teacher'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Generate teacher ID and default password
      const { data: teacherId, error: idError } = await supabase.rpc('generate_teacher_id');
      if (idError) throw idError;

      const { data: defaultPassword, error: pwError } = await supabase.rpc('generate_default_password');
      if (pwError) throw pwError;

      // Update the profile with teacher details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.fullName,
          phone: formData.phone,
          teacher_id: teacherId,
          default_password: defaultPassword,
          must_change_password: true
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Check if role already exists (created by trigger), if not create it
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', authData.user.id)
        .eq('role', 'teacher')
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'teacher'
          });

        if (roleError && !roleError.message?.includes('duplicate')) {
          throw roleError;
        }
      }

      // Set the created teacher details
      setCreatedTeacher({
        teacherId: teacherId,
        password: defaultPassword,
        email: formData.email,
        name: formData.fullName
      });

      toast.success("Teacher created successfully!");
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
      });
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.message || "Failed to create teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start gap-3">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create Teacher Account</h1>
              <p className="text-muted-foreground mt-2">
                Add a new teacher to the system and assign them credentials
              </p>
            </div>
          </div>
        </div>

        {createdTeacher && (
          <Alert className="mb-6 bg-gradient-primary/10 border-primary">
            <AlertDescription>
              <div className="space-y-4">
                <p className="font-semibold text-lg">Teacher Account Created Successfully!</p>
                
                <div className="space-y-3 bg-background p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Teacher Name</p>
                      <p className="font-medium">{createdTeacher.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Teacher ID (Username)</p>
                      <p className="font-mono font-bold text-lg">{createdTeacher.teacherId}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(createdTeacher.teacherId, "Teacher ID")}
                    >
                      {copiedField === "Teacher ID" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Default Password</p>
                      <p className="font-mono font-bold text-lg">{createdTeacher.password}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(createdTeacher.password, "Password")}
                    >
                      {copiedField === "Password" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{createdTeacher.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(createdTeacher.email, "Email")}
                    >
                      {copiedField === "Email" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  ⚠️ <strong>Important:</strong> Please save these credentials. The teacher will use their <strong>Teacher ID</strong> as their username and can change their password after first login.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter teacher's full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Teacher...' : 'Create Teacher Account'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/teacher-assignments')}
                >
                  Go to Teacher Assignment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherCreation;
