import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Megaphone, Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PassAnnouncement = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_roles: ["student", "teacher"] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.target_roles.length === 0) {
      toast.error("Please select at least one target audience");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user.user) {
        toast.error("Authentication error");
        return;
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          target_roles: formData.target_roles,
          created_by: user.user.id,
          is_active: true
        });

      if (error) throw error;
      
      toast.success("Announcement sent successfully! Students and teachers will see your message.");
      
      // Reset form
      setFormData({ 
        title: "", 
        content: "", 
        target_roles: ["student", "teacher"] 
      });
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to send announcement');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <Megaphone className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pass Announcement</h1>
              <p className="text-white/90">Send messages to students and teachers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-primary" />
                Create New Announcement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base font-medium">
                    Announcement Title *
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
                    Message Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your announcement message here. Be clear and concise."
                    rows={6}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium mb-3 block">
                    Target Audience *
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="student"
                        checked={formData.target_roles.includes('student')}
                        onCheckedChange={(checked) => handleRoleChange('student', checked as boolean)}
                      />
                      <Label htmlFor="student" className="text-base cursor-pointer">
                        Students
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="teacher"
                        checked={formData.target_roles.includes('teacher')}
                        onCheckedChange={(checked) => handleRoleChange('teacher', checked as boolean)}
                      />
                      <Label htmlFor="teacher" className="text-base cursor-pointer">
                        Teachers
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 h-12" 
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Announcement'}
                  </Button>
                  <Link to="/" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-muted/30">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">📢 How it works:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your announcement will appear as a banner on student and teacher dashboards</li>
                <li>• Users can dismiss announcements, and they'll be saved in their browser</li>
                <li>• Only active announcements are displayed to users</li>
                <li>• You can manage all announcements from the Announcement Manager</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PassAnnouncement;