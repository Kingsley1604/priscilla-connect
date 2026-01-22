import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminSector } from "@/hooks/useAdminSector";

const TeacherCreation = () => {
  const navigate = useNavigate();
  const { adminSector, getAllowedSectors, isSuperAdmin } = useAdminSector();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTeacher, setCreatedTeacher] = useState<{
    teacherId: string;
    password: string;
    email: string;
    name: string;
    teacherType: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    teacherType: "subject", // "class" or "subject"
    sector: "" // "primary", "secondary", or "both" (for subject teachers)
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

    if (!formData.sector) {
      toast.error("Please select a sector (Primary or Secondary)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate default password first
      const { data: defaultPassword, error: pwError } = await supabase.rpc('generate_default_password');
      if (pwError) throw pwError;

      // Create the teacher user in Supabase Auth with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: defaultPassword, // Use the generated password directly
        options: {
          data: {
            name: formData.fullName,
            role: 'teacher'
          },
          emailRedirectTo: undefined // Disable email confirmation redirect
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Generate teacher ID
      const { data: teacherId, error: idError } = await supabase.rpc('generate_teacher_id');
      if (idError) throw idError;

      // Update the profile with teacher details including sector
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.fullName,
          phone: formData.phone,
          teacher_id: teacherId,
          default_password: defaultPassword,
          must_change_password: true,
          sector: formData.sector // Save sector to profile
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
        name: formData.fullName,
        teacherType: formData.teacherType
      });

      toast.success("Teacher created successfully!");
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        teacherType: "subject",
        sector: ""
      });
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.message || "Failed to create teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Teacher Account</h1>
              <p className="text-white/80">Add a new teacher to the system</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-6">

        {createdTeacher && (
          <Alert className="mb-6 bg-gradient-primary/10 border-primary">
            <AlertDescription>
              <div className="space-y-4">
                <p className="font-semibold text-lg">Teacher Account Created Successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Type: <strong>{createdTeacher.teacherType === 'class' ? 'Class Teacher' : 'Subject Teacher'}</strong>
                </p>
                
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
                  {createdTeacher.teacherType === 'class' && (
                    <span className="block mt-2">📌 Since this is a <strong>Class Teacher</strong>, go to Teacher Assignments to assign them a class.</span>
                  )}
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
                <Label htmlFor="teacherType">Teacher Type *</Label>
                <Select
                  value={formData.teacherType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, teacherType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class Teacher (Can manage a class)</SelectItem>
                    <SelectItem value="subject">Subject Teacher (Teaches subjects only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.teacherType === 'class' 
                    ? 'Class teachers can manage students, attendance, and class affairs' 
                    : 'Subject teachers can only manage their assigned subjects'}
                </p>
              </div>

              <div>
                <Label htmlFor="sector">Sector *</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Task F: Fixed - Show only 3 sector options */}
                    <SelectItem value="primary">Primary Section Only</SelectItem>
                    <SelectItem value="secondary">Secondary Section Only</SelectItem>
                    {formData.teacherType === 'subject' && (isSuperAdmin || !adminSector || adminSector === 'both') && (
                      <SelectItem value="both">Both Primary & Secondary</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.teacherType === 'subject' 
                    ? 'Subject teachers can be assigned to primary, secondary, or both sectors.'
                    : 'Teacher will only be visible and manageable within their assigned sector.'}
                </p>
              </div>

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
