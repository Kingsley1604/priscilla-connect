import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, X, ShoppingCart, MessageSquare, UserPlus, LogIn, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_order_id?: string;
}

interface OrderDetails {
  id: string;
  items: any[];
  total_amount: number;
  status: string;
  delivery_address: string | null;
  phone_number: string | null;
  notes: string | null;
  order_date: string;
}

const AdminNotificationSystem = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const viewOrderDetails = async (orderId: string, notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return;
      }

      // Cast items to array
      const orderData: OrderDetails = {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      };

      setSelectedOrder(orderData);
      setIsOrderDialogOpen(true);
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error viewing order:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
      case 'order_placed':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'login':
      case 'signup':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'message_notification':
      case 'call_notification':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'content_alert':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
      case 'order_placed':
        return <ShoppingCart className="h-4 w-4" />;
      case 'message_notification':
        return <MessageSquare className="h-4 w-4" />;
      case 'signup':
        return <UserPlus className="h-4 w-4" />;
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'content_alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Only render for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)} 
          className="relative text-white hover:bg-white/20"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <Card className="absolute top-12 right-0 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-[100] shadow-lg border bg-background">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          if (notification.related_order_id) {
                            viewOrderDetails(notification.related_order_id, notification.id);
                          } else {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 p-2 rounded-full ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                            
                            {notification.related_order_id && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-6 px-0 text-xs text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewOrderDetails(notification.related_order_id!, notification.id);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Order Details
                              </Button>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              {!notification.is_read && !notification.related_order_id && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }} 
                                  className="h-6 px-2 text-xs"
                                >
                                  Mark read
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }} 
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

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              View order information and delivery preferences
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium text-xs truncate">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.order_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-primary">₦{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Delivery Information</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Type</p>
                    <Badge variant={selectedOrder.delivery_address ? 'default' : 'outline'}>
                      {selectedOrder.delivery_address ? '🏠 Home Delivery' : '🏫 School Pickup'}
                    </Badge>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm">{selectedOrder.delivery_address}</p>
                    </div>
                  )}
                  {selectedOrder.phone_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{selectedOrder.phone_number}</p>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Items Ordered</p>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name || 'Item'}</span>
                        <Badge variant="outline" className="text-xs">x{item.quantity || 1}</Badge>
                      </div>
                      <span className="text-sm">₦{(item.price || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminNotificationSystem;
