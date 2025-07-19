import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, X, Clock, MapPin, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  type: 'login' | 'content_alert' | 'signup';
  message: string;
  timestamp: string;
  userId?: string;
  username?: string;
  device?: string;
  location?: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

const AdminNotificationSystem = () => {
  const { user } = useAuth();
  
  // Check if user is admin - must be before any useState/useEffect hooks
  if (!user || user.role !== 'admin') {
    return null;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load existing notifications from localStorage
    const stored = localStorage.getItem('priscilla_admin_notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail as Notification;
      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50); // Keep only last 50
        localStorage.setItem('priscilla_admin_notifications', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('admin-notification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('admin-notification', handleNewNotification as EventListener);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('priscilla_admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('priscilla_admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('priscilla_admin_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Admin Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-muted/50 ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(notification.severity)}>
                              {notification.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{notification.message}</p>
                          
                          {(notification.device || notification.location) && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              {notification.device && (
                                <div className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  <span>{notification.device}</span>
                                </div>
                              )}
                              {notification.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{notification.location}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminNotificationSystem;