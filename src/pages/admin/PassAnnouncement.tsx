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

const PassAnnouncement = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_roles: ["student", "teacher"] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.target_roles.length === 0) {
      toast.error("Please select at least one target audience");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          target_roles: formData.target_roles,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
      
      toast.success("Announcement published successfully! Students and teachers will see it on their dashboards.");
      
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="bg-gradient-primary p-3 rounded-lg">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            Pass Announcement
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and publish announcements that will appear on student and teacher dashboards.
          </p>
        </div>

        <DemoInstructions />

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-medium">
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
                <Label htmlFor="content" className="text-base font-medium">
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
                <p className="text-sm text-muted-foreground mt-1">
                  Keep your message clear and concise for better readability.
                </p>
              </div>

              <div>
                <Label className="text-base font-medium">Target Audience</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select who should see this announcement
                </p>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="student"
                      checked={formData.target_roles.includes('student')}
                      onCheckedChange={(checked) => handleRoleChange('student', checked as boolean)}
                    />
                    <Label htmlFor="student" className="font-medium">Students</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teacher"
                      checked={formData.target_roles.includes('teacher')}
                      onCheckedChange={(checked) => handleRoleChange('teacher', checked as boolean)}
                    />
                    <Label htmlFor="teacher" className="font-medium">Teachers</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
          <h3 className="font-medium mb-2">📢 How it works:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your announcement will appear at the top of student and teacher dashboards</li>
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