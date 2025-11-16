import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface AnnouncementBannerProps {
  userRole: 'student' | 'teacher' | 'admin';
}

const AnnouncementBanner = ({ userRole }: AnnouncementBannerProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, [userRole]);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, target_roles')
        .eq('is_active', true)
        .contains('target_roles', [userRole])
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      
      // If no announcements, show demo announcement
      if (!data || data.length === 0) {
        setAnnouncements([{
          id: 'demo-announcement',
          title: '🎉 Welcome to Priscilla Connect!',
          content: 'This is a demo announcement. Admins can create real announcements from the "Pass Announcement" feature on their dashboard. These announcements will appear here for students and teachers.',
          created_at: new Date().toISOString()
        }]);
      } else {
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Show demo on error too
      setAnnouncements([{
        id: 'demo-announcement',
        title: '🎉 Welcome to Priscilla Connect!',
        content: 'This is a demo announcement. Admins can create real announcements from the "Pass Announcement" feature on their dashboard.',
        created_at: new Date().toISOString()
      }]);
    }
  };

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => [...prev, id]);
    // Store in localStorage to persist across sessions
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    dismissed.push(id);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissed));
  };

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedAnnouncements(dismissed);
  }, []);

  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {visibleAnnouncements.map((announcement) => (
        <Card key={announcement.id} className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Megaphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {announcement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAnnouncement(announcement.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementBanner;