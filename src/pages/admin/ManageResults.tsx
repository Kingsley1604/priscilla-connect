import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Folder, FolderOpen, FileText, User, Calendar, Clock, ChevronRight, Bell, Check, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

interface ResultNotification {
  id: string;
  teacher_id: string;
  teacher_name: string;
  class_name: string;
  student_name: string;
  result_type: string;
  submitted_at: string;
  created_at: string;
  is_read: boolean;
}

interface TeacherFolder {
  teacher_id: string;
  teacher_name: string;
  class_name: string;
  midterm_results: ResultNotification[];
  exam_results: ResultNotification[];
  total_count: number;
  unread_count: number;
}

const ManageResults = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ResultNotification[]>([]);
  const [teacherFolders, setTeacherFolders] = useState<TeacherFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('result_upload_notifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      
      // Task I: Group notifications by teacher and class into folder structure
      const folders: Record<string, TeacherFolder> = {};
      
      (data || []).forEach((notification: ResultNotification) => {
        const key = `${notification.teacher_id}-${notification.class_name}`;
        
        if (!folders[key]) {
          folders[key] = {
            teacher_id: notification.teacher_id,
            teacher_name: notification.teacher_name,
            class_name: notification.class_name,
            midterm_results: [],
            exam_results: [],
            total_count: 0,
            unread_count: 0
          };
        }
        
        // Sort into subfolders based on result type
        if (notification.result_type.toLowerCase().includes('mid')) {
          folders[key].midterm_results.push(notification);
        } else {
          folders[key].exam_results.push(notification);
        }
        
        folders[key].total_count++;
        if (!notification.is_read) {
          folders[key].unread_count++;
        }
      });
      
      setTeacherFolders(Object.values(folders));
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('result_upload_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      // Reload to refresh folder counts
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async (teacherId: string, className: string) => {
    try {
      const { error } = await supabase
        .from('result_upload_notifications')
        .update({ is_read: true })
        .eq('teacher_id', teacherId)
        .eq('class_name', className);

      if (error) throw error;
      
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const toggleFolder = (key: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedFolders(newSet);
  };

  const totalUnread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-4 sm:py-6 px-4 sm:px-6 shadow-medium">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Manage Results</h1>
              <p className="text-white/80 text-sm sm:text-base truncate">
                View submitted results by teachers
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-white/20 text-white ml-auto">
              <Bell className="h-3 w-3 mr-1" />
              {totalUnread} new
            </Badge>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Teacher Folders</p>
                  <p className="text-2xl font-bold">{teacherFolders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Results</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{totalUnread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                  <p className="text-2xl font-bold">{notifications.length - totalUnread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task I: Teacher Folders Structure */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading results...</p>
            </CardContent>
          </Card>
        ) : teacherFolders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Submitted Yet</h3>
              <p className="text-muted-foreground">
                When teachers submit results, they will appear here organized by teacher and class.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teacherFolders.map((folder) => {
              const folderKey = `${folder.teacher_id}-${folder.class_name}`;
              const isExpanded = expandedFolders.has(folderKey);
              
              return (
                <Card key={folderKey} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFolder(folderKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <FolderOpen className="h-6 w-6 text-primary" />
                        ) : (
                          <Folder className="h-6 w-6 text-primary" />
                        )}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {folder.teacher_name}
                            <Badge variant="outline">{folder.class_name}</Badge>
                          </CardTitle>
                          <CardDescription>
                            {folder.total_count} result(s) submitted
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {folder.unread_count > 0 && (
                          <Badge variant="destructive">
                            {folder.unread_count} new
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead(folder.teacher_id, folder.class_name);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark all read
                        </Button>
                        <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Mid Term Results Subfolder */}
                        <Card className="border-dashed">
                          <CardHeader className="py-3 px-4 bg-blue-50 dark:bg-blue-950/30">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-500" />
                              Mid Term Results
                              <Badge variant="secondary" className="ml-auto">
                                {folder.midterm_results.length}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2">
                            <ScrollArea className="max-h-60">
                              {folder.midterm_results.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No mid term results
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {folder.midterm_results.map((result) => (
                                    <div 
                                      key={result.id}
                                      className={`p-3 rounded-lg border ${!result.is_read ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}
                                      onClick={() => !result.is_read && markAsRead(result.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium text-sm">{result.student_name}</span>
                                        </div>
                                        {!result.is_read && (
                                          <Badge variant="default" className="text-xs">New</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(result.submitted_at), 'MMM d, yyyy h:mm a')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </CardContent>
                        </Card>

                        {/* Examination Results Subfolder */}
                        <Card className="border-dashed">
                          <CardHeader className="py-3 px-4 bg-green-50 dark:bg-green-950/30">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              Examination Results
                              <Badge variant="secondary" className="ml-auto">
                                {folder.exam_results.length}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-2">
                            <ScrollArea className="max-h-60">
                              {folder.exam_results.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No examination results
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {folder.exam_results.map((result) => (
                                    <div 
                                      key={result.id}
                                      className={`p-3 rounded-lg border cursor-pointer ${!result.is_read ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}
                                      onClick={() => !result.is_read && markAsRead(result.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium text-sm">{result.student_name}</span>
                                        </div>
                                        {!result.is_read && (
                                          <Badge variant="default" className="text-xs">New</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(result.submitted_at), 'MMM d, yyyy h:mm a')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageResults;