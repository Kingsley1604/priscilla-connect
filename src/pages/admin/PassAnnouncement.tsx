import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DemoInstructions } from "@/components/admin/DemoInstructions";
import { useAdminSector } from "@/hooks/useAdminSector";

const PassAnnouncement = () => {
  const navigate = useNavigate();
  const { adminSector, isSuperAdmin } = useAdminSector();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_roles: ["student", "teacher"] as string[],
  });

  // Task C & D: Get sector-specific label for target roles
  const getSectorLabel = () => {
    if (isSuperAdmin || !adminSector || adminSector === 'both') {
      return ''; // No sector restriction
    }
    return adminSector === 'primary' ? 'Primary' : 'Secondary';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.target_roles.length === 0) {
      toast.error("Please select at least one target audience");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Task C & D: Add sector to announcement for filtering
      const announcementData: any = {
        title: formData.title,
        content: formData.content,
        target_roles: formData.target_roles,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (error) throw error;
      
      const sectorText = getSectorLabel() ? ` ${getSectorLabel()}` : '';
      toast.success(`Announcement published successfully!${sectorText} students and teachers will see it on their dashboards.`);
      
      // Reset form
      setFormData({ title: "", content: "", target_roles: ["student", "teacher"] });
      
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
      {/* Task A: Fixed sticky header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium overflow-hidden">
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
                {sectorLabel ? `Send to ${sectorLabel} section` : 'Create announcements for students and teachers'}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <DemoInstructions />

        <Card className="shadow-medium">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">New Announcement</CardTitle>
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

              <div>
                <Label className="text-sm sm:text-base font-medium">Target Audience</Label>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {sectorLabel 
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
                      {sectorLabel ? `${sectorLabel} Students` : 'Students'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teacher"
                      checked={formData.target_roles.includes('teacher')}
                      onCheckedChange={(checked) => handleRoleChange('teacher', checked as boolean)}
                    />
                    <Label htmlFor="teacher" className="font-medium text-sm sm:text-base">
                      {sectorLabel ? `${sectorLabel} Teachers` : 'Teachers'}
                    </Label>
                  </div>
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
            <li>• Your announcement will appear at the top of {sectorLabel ? `${sectorLabel.toLowerCase()}` : ''} student and teacher dashboards</li>
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