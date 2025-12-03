import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, X, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamCompletion {
  id: string;
  student_id: string;
  exam_id: string;
  submitted_at: string;
  score: number | null;
  total_questions: number;
}

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  examTitle?: string;
  score?: number | null;
  totalQuestions?: number;
}

const TeacherExamNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadExistingNotifications();
    setupRealtimeSubscription();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const loadExistingNotifications = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get teacher's exams
      const { data: exams } = await supabase
        .from("exams")
        .select("id, title")
        .eq("created_by", user.user.id);

      if (!exams || exams.length === 0) return;

      const examIds = exams.map(e => e.id);
      const examMap = new Map(exams.map(e => [e.id, e.title]));

      // Get recent completions
      const { data: completions } = await supabase
        .from("exam_attempts")
        .select("id, student_id, exam_id, submitted_at, score, total_questions")
        .in("exam_id", examIds)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(20);

      if (completions) {
        const notifs: Notification[] = completions.map(c => ({
          id: c.id,
          message: `A student completed "${examMap.get(c.exam_id) || "Exam"}"`,
          timestamp: new Date(c.submitted_at!),
          read: false,
          examTitle: examMap.get(c.exam_id),
          score: c.score,
          totalQuestions: c.total_questions
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const setupRealtimeSubscription = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get teacher's exams for filtering
    const { data: exams } = await supabase
      .from("exams")
      .select("id, title")
      .eq("created_by", user.user.id);

    if (!exams || exams.length === 0) return;

    const examIds = exams.map(e => e.id);
    const examMap = new Map(exams.map(e => [e.id, e.title]));

    // Subscribe to exam_attempts changes
    const channel = supabase
      .channel("teacher-exam-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exam_attempts",
        },
        (payload) => {
          const attempt = payload.new as ExamCompletion;
          
          // Check if this exam belongs to the teacher and was just submitted
          if (examIds.includes(attempt.exam_id) && attempt.submitted_at) {
            const newNotification: Notification = {
              id: attempt.id,
              message: `A student completed "${examMap.get(attempt.exam_id) || "Exam"}"`,
              timestamp: new Date(attempt.submitted_at),
              read: false,
              examTitle: examMap.get(attempt.exam_id),
              score: attempt.score,
              totalQuestions: attempt.total_questions
            };

            // Show toast notification
            toast.success(`Student completed: ${examMap.get(attempt.exam_id)}`, {
              description: attempt.score !== null 
                ? `Score: ${attempt.score}/${attempt.total_questions}`
                : "Exam submitted successfully",
              duration: 5000,
            });

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Exam Notifications
            </SheetTitle>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
                <Button variant="ghost" size="sm" onClick={clearNotifications}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-150px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-2">
                You'll be notified when students complete your exams
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${
                    notification.read ? "opacity-60" : "bg-primary/5"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            {notification.message}
                          </p>
                          {notification.score !== null && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Score: {notification.score}/{notification.totalQuestions}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3" />
                            {format(notification.timestamp, "MMM dd, h:mm a")}
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TeacherExamNotifications;
