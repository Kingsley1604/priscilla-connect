import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Phone, Calendar, Megaphone, CheckCircle, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'message' | 'call' | 'event' | 'announcement' | 'group_call' | 'exam_complete' | 'report_approved';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: any;
  senderId?: string;
}

interface UnifiedNotificationsProps {
  userRole: 'student' | 'teacher' | 'admin';
}

// Local storage key for read notifications
const READ_NOTIFICATIONS_KEY = 'priscilla_read_notifications';

const getReadNotifications = (): Set<string> => {
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadNotification = (id: string) => {
  try {
    const readSet = getReadNotifications();
    readSet.add(id);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readSet]));
  } catch (e) {
    console.error('Error saving read notification:', e);
  }
};

const saveAllAsRead = (ids: string[]) => {
  try {
    const readSet = getReadNotifications();
    ids.forEach(id => readSet.add(id));
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readSet]));
  } catch (e) {
    console.error('Error saving read notifications:', e);
  }
};

const UnifiedNotifications = ({ userRole }: UnifiedNotificationsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    const allNotifications: Notification[] = [];
    const readNotifications = getReadNotifications();

    try {
      // 1. Load unread messages (for all users)
      const { data: unreadMessages } = await supabase
        .from('chat_messages')
        .select('id, sender_id, content, created_at')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (unreadMessages) {
        for (const msg of unreadMessages) {
          const { data: sender } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', msg.sender_id)
            .single();

          const notifId = `msg-${msg.id}`;
          allNotifications.push({
            id: notifId,
            type: 'message',
            title: 'New Message',
            message: `${sender?.name || 'Someone'}: ${msg.content.substring(0, 50)}...`,
            timestamp: new Date(msg.created_at),
            read: readNotifications.has(notifId),
            senderId: msg.sender_id
          });
        }
      }

      // 2. Load missed calls (for all users)
      const { data: missedCalls } = await supabase
        .from('missed_calls')
        .select('id, caller_id, call_type, created_at')
        .eq('receiver_id', user.id)
        .eq('is_seen', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (missedCalls) {
        for (const call of missedCalls) {
          const { data: caller } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', call.caller_id)
            .single();

          const notifId = `call-${call.id}`;
          allNotifications.push({
            id: notifId,
            type: 'call',
            title: 'Missed Call',
            message: `${caller?.name || 'Someone'} tried to ${call.call_type === 'video' ? 'video' : 'voice'} call you`,
            timestamp: new Date(call.created_at),
            read: readNotifications.has(notifId),
            senderId: call.caller_id
          });
        }
      }

      // 3. Load recent events (for all users)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentEvents } = await supabase
        .from('events')
        .select('id, title, date, created_at')
        .eq('status', 'approved')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentEvents) {
        for (const event of recentEvents) {
          const notifId = `event-${event.id}`;
          allNotifications.push({
            id: notifId,
            type: 'event',
            title: 'New Event',
            message: `${event.title} - ${format(new Date(event.date), 'MMM dd, yyyy')}`,
            timestamp: new Date(event.created_at),
            read: readNotifications.has(notifId)
          });
        }
      }

      // 4. Load announcements (for all users)
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, content, created_at')
        .eq('is_active', true)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcements) {
        for (const announcement of announcements) {
          const notifId = `announce-${announcement.id}`;
          allNotifications.push({
            id: notifId,
            type: 'announcement',
            title: 'New Announcement',
            message: `${announcement.title}: ${announcement.content.substring(0, 50)}...`,
            timestamp: new Date(announcement.created_at),
            read: readNotifications.has(notifId)
          });
        }
      }

      // 5. For teachers: Load exam completions
      if (userRole === 'teacher') {
        const { data: exams } = await supabase
          .from('exams')
          .select('id, title')
          .eq('created_by', user.id);

        if (exams && exams.length > 0) {
          const examIds = exams.map(e => e.id);
          const examMap = new Map(exams.map(e => [e.id, e.title]));

          const { data: completions } = await supabase
            .from('exam_attempts')
            .select('id, exam_id, submitted_at, score, total_questions')
            .in('exam_id', examIds)
            .not('submitted_at', 'is', null)
            .order('submitted_at', { ascending: false })
            .limit(10);

          if (completions) {
            for (const c of completions) {
              const notifId = `exam-${c.id}`;
              allNotifications.push({
                id: notifId,
                type: 'exam_complete',
                title: 'Exam Completed',
                message: `Student completed "${examMap.get(c.exam_id) || 'Exam'}" - Score: ${c.score}/${c.total_questions}`,
                timestamp: new Date(c.submitted_at!),
                read: readNotifications.has(notifId)
              });
            }
          }
        }

        // Load approved reports for teachers
        const { data: approvedReports } = await supabase
          .from('secondary_report_cards')
          .select('id, student_name, class_level, approved_at')
          .eq('created_by', user.id)
          .eq('status', 'approved')
          .not('approved_at', 'is', null)
          .order('approved_at', { ascending: false })
          .limit(5);

        if (approvedReports) {
          for (const report of approvedReports) {
            const notifId = `report-${report.id}`;
            allNotifications.push({
              id: notifId,
              type: 'report_approved',
              title: 'Report Approved',
              message: `${report.student_name}'s ${report.class_level} result has been approved`,
              timestamp: new Date(report.approved_at!),
              read: readNotifications.has(notifId)
            });
          }
        }
      }

      // Sort by timestamp
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(allNotifications.slice(0, 30));
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user, userRole]);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscriptions
    const channels: any[] = [];

    // Subscribe to new messages
    const msgChannel = supabase
      .channel('unified-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          if (payload.new && (payload.new as any).receiver_id === user?.id) {
            loadNotifications();
          }
        }
      )
      .subscribe();
    channels.push(msgChannel);

    // Subscribe to missed calls
    const callChannel = supabase
      .channel('unified-calls')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'missed_calls' },
        (payload) => {
          if (payload.new && (payload.new as any).receiver_id === user?.id) {
            loadNotifications();
          }
        }
      )
      .subscribe();
    channels.push(callChannel);

    // Subscribe to events
    const eventChannel = supabase
      .channel('unified-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        () => loadNotifications()
      )
      .subscribe();
    channels.push(eventChannel);

    // Subscribe to announcements
    const announceChannel = supabase
      .channel('unified-announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        () => loadNotifications()
      )
      .subscribe();
    channels.push(announceChannel);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [loadNotifications, user]);

  // Task H: Navigate to relevant page on notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read locally and persist
    saveReadNotification(notification.id);
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    setIsOpen(false);

    // Navigate based on notification type
    if (notification.type === 'message' || notification.type === 'call') {
      navigate('/messages');
    } else if (notification.type === 'event') {
      navigate('/calendar');
    } else if (notification.type === 'announcement') {
      navigate('/dashboard');
    } else if (notification.type === 'report_approved') {
      navigate('/reports');
    }
  };

  // Task I: Mark all as read with persistence
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    saveAllAsRead(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    const allIds = notifications.map(n => n.id);
    saveAllAsRead(allIds);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'call': return <Phone className="h-4 w-4 text-red-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'announcement': return <Megaphone className="h-4 w-4 text-purple-500" />;
      case 'group_call': return <Video className="h-4 w-4 text-orange-500" />;
      case 'exam_complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'report_approved': return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'message': return 'Message';
      case 'call': return 'Missed Call';
      case 'event': return 'Event';
      case 'announcement': return 'Announcement';
      case 'group_call': return 'Group Call';
      case 'exam_complete': return 'Exam';
      case 'report_approved': return 'Report';
      default: return 'Notification';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {/* Task F: Bell icon - black in light mode on mobile/tablet, white on desktop for all portals */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-gray-900 dark:text-white sm:text-white hover:bg-white/20 sm:hover:bg-white/20"
        >
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
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
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
                You'll be notified about messages, calls, events, and more
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
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(notification.timestamp, "MMM dd, h:mm a")}
                          </p>
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

export default UnifiedNotifications;
