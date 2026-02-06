import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ArrowLeft, Users, School, Building, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DemoInstructions } from "@/components/admin/DemoInstructions";
import { useAdminSector } from "@/hooks/useAdminSector";
import { useAuth } from "@/hooks/useAuth";

const PassAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { adminSector, isSuperAdmin } = useAdminSector();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Task I: Super admin can target all users, primary only, secondary only, or admins
  const [targetScope, setTargetScope] = useState<'all' | 'primary' | 'secondary'>('all');
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_roles: ["student", "teacher"] as string[],
    include_admins: false,
  });

  // Get sector-specific label for target roles
  const getSectorLabel = () => {
    if (isSuperAdmin) {
      if (targetScope === 'primary') return 'Primary';
      if (targetScope === 'secondary') return 'Secondary';
      return ''; // All sectors
    }
    if (!adminSector || adminSector === 'both') return '';
    return adminSector === 'primary' ? 'Primary' : 'Secondary';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.target_roles.length === 0 && !formData.include_admins) {
      toast.error("Please select at least one target audience");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build target roles array
      let targetRoles = [...formData.target_roles];
      if (formData.include_admins) {
        targetRoles.push('admin');
      }

      // Task I: Determine sector for announcement
      let creatorSector: string | null = null;
      if (isSuperAdmin) {
        // Super admin can choose the scope
        creatorSector = targetScope === 'all' ? null : targetScope;
      } else {
        // Regular admin uses their own sector
        creatorSector = adminSector || null;
      }

      const announcementData = {
        title: formData.title,
        content: formData.content,
        target_roles: targetRoles,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        creator_sector: creatorSector,
      };

      const { error } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (error) throw error;
      
      const sectorText = getSectorLabel() ? ` ${getSectorLabel()}` : ' all';
      const audienceText = formData.include_admins ? 'users including admins' : 'students and teachers';
      toast.success(`Announcement published successfully!${sectorText} ${audienceText} will see it on their dashboards.`);
      
      // Reset form
      setFormData({ title: "", content: "", target_roles: ["student", "teacher"], include_admins: false });
      setTargetScope('all');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to publish announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        target_roles: [...prev.target_roles, role]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        target_roles: prev.target_roles.filter(r => r !== role)
      }));
    }
  };

  const sectorLabel = getSectorLabel();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Task J: Fixed, not sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium overflow-hidden">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
              <Megaphone className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Pass Announcement</h1>
              <p className="text-white/80 text-sm sm:text-base truncate">
                {isSuperAdmin ? 'Super Admin - Send to all sections' : sectorLabel ? `Send to ${sectorLabel} section` : 'Create announcements for students and teachers'}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-24 sm:h-28" />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <DemoInstructions />

        <Card className="shadow-medium">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              New Announcement
              {isSuperAdmin && (
                <Badge variant="secondary" className="ml-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm sm:text-base font-medium">
                  Announcement Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, descriptive title"
                  className="mt-2"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content" className="text-sm sm:text-base font-medium">
                  Message Content
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement message here..."
                  rows={6}
                  className="mt-2"
                  required
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Keep your message clear and concise for better readability.
                </p>
              </div>

              {/* Task I: Super Admin Scope Selection */}
              {isSuperAdmin && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Announcement Scope (Super Admin Only)
                  </Label>
                  <RadioGroup value={targetScope} onValueChange={(value: 'all' | 'primary' | 'secondary') => setTargetScope(value)}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="all" id="scope-all" />
                        <Label htmlFor="scope-all" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Users className="h-4 w-4 text-green-600" />
                          All Users
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="primary" id="scope-primary" />
                        <Label htmlFor="scope-primary" className="flex items-center gap-2 cursor-pointer font-medium">
                          <School className="h-4 w-4 text-blue-600" />
                          Primary Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="secondary" id="scope-secondary" />
                        <Label htmlFor="scope-secondary" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Building className="h-4 w-4 text-purple-600" />
                          Secondary Only
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    {targetScope === 'all' && '📢 This announcement will be visible to ALL users in both Primary and Secondary sections.'}
                    {targetScope === 'primary' && '🏫 This announcement will only be visible to Primary section users (Play Group to Primary 6).'}
                    {targetScope === 'secondary' && '🏛️ This announcement will only be visible to Secondary section users (JSS 1 to SS 3).'}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm sm:text-base font-medium">Target Audience</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {isSuperAdmin && targetScope !== 'all'
                    ? `This announcement will be sent to ${targetScope === 'primary' ? 'Primary' : 'Secondary'} section only`
                    : sectorLabel 
                      ? `This announcement will be sent to ${sectorLabel} section only`
                      : 'Select who should see this announcement'}
                </p>
                <div className="flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="student"
                      checked={formData.target_roles.includes('student')}
                      onCheckedChange={(checked) => handleRoleChange('student', checked as boolean)}
                    />
                    <Label htmlFor="student" className="font-medium text-sm sm:text-base">
                      Students
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teacher"
                      checked={formData.target_roles.includes('teacher')}
                      onCheckedChange={(checked) => handleRoleChange('teacher', checked as boolean)}
                    />
                    <Label htmlFor="teacher" className="font-medium text-sm sm:text-base">
                      Teachers
                    </Label>
                  </div>
                  {/* Task I: Super admin can also include admins */}
                  {isSuperAdmin && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include_admins"
                        checked={formData.include_admins}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_admins: checked as boolean }))}
                      />
                      <Label htmlFor="include_admins" className="font-medium text-sm sm:text-base flex items-center gap-1">
                        <Shield className="h-3 w-3 text-primary" />
                        Include Admins
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2 text-sm sm:text-base">📢 How it works:</h3>
          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
            {isSuperAdmin ? (
              <>
                <li>• As Super Admin, you can send announcements to all users, primary only, or secondary only</li>
                <li>• You can optionally include admins in the announcement recipients</li>
                <li>• Use this for important system-wide announcements like maintenance or security updates</li>
              </>
            ) : (
              <li>• Your announcement will appear at the top of {sectorLabel ? `${sectorLabel.toLowerCase()}` : ''} student and teacher dashboards</li>
            )}
            <li>• Users can dismiss announcements they've read</li>
            <li>• Only active announcements are displayed</li>
            <li>• You can manage all announcements from the Announcements page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PassAnnouncement;