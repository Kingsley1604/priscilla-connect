import { useState, useEffect, useCallback } from 'react';
import { FileText, UserX } from 'lucide-react';
import { Bell, AlertTriangle, X, ShoppingCart, MessageSquare, UserPlus, LogIn, Eye, User, Phone, MapPin, Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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

interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface OrderDetails {
  id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  delivery_address: string | null;
  phone_number: string | null;
  notes: string | null;
  order_date: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
}

const AdminNotificationSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  // Allow both admin and teacher to see notifications
  const canViewNotifications = user?.role === 'admin' || user?.role === 'teacher';

  const fetchNotifications = useCallback(async () => {
    if (!user || !canViewNotifications) return;
    
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

      // Task J & K & L: Also fetch result upload notifications
      const { data: resultNotifications } = await supabase
        .from('result_upload_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Task B & C: Fetch suspension notifications
      const { data: suspensionNotifications } = await supabase
        .from('admin_suspension_notifications')
        .select('*')
        .eq('is_handled', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Convert result notifications to standard format
      const convertedResultNotifications: Notification[] = (resultNotifications || []).map(n => ({
        id: `result_${n.id}`,
        title: 'Result Uploaded',
        message: `${n.teacher_name} (${n.class_name}) submitted ${n.result_type} for ${n.student_name}`,
        type: 'result_upload',
        is_read: n.is_read,
        created_at: n.created_at,
      }));

      // Convert suspension notifications to standard format
      const convertedSuspensionNotifications: Notification[] = (suspensionNotifications || []).map(n => ({
        id: `suspension_${n.id}`,
        title: 'Suspension Request',
        message: `${n.teacher_name} (${n.class_name}) requested suspension for ${n.student_name}: ${n.reason}`,
        type: 'suspension_request',
        is_read: n.is_read,
        created_at: n.created_at,
      }));

      // Combine all notifications
      const allNotifications = [
        ...(data || []),
        ...convertedResultNotifications,
        ...convertedSuspensionNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, canViewNotifications]);

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

      // Get customer profile info
      let customerName = 'Unknown Customer';
      let customerEmail = '';
      
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.user_id)
          .single();
        
        if (profile?.name) {
          customerName = profile.name;
        }
      }

      // Cast items to array with proper typing
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const parsedItems: OrderItem[] = rawItems.map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          id: (i.id as string) || '',
          name: (i.name as string) || 'Unknown Item',
          price: typeof i.price === 'number' ? i.price : 0,
          quantity: typeof i.quantity === 'number' ? i.quantity : 1,
          image_url: (i.image_url as string) || undefined
        };
      });

      const orderData: OrderDetails = {
        ...data,
        items: parsedItems,
        customer_name: customerName,
        customer_email: customerEmail
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
      case 'result_upload':
        return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'suspension_request':
        return 'bg-red-500/10 text-red-600 border-red-200';
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
      case 'result_upload':
        return <FileText className="h-4 w-4" />;
      case 'suspension_request':
        return <UserX className="h-4 w-4" />;
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

  // Render for admin and teacher users
  if (!user || !canViewNotifications) {
    return null;
  }

  return (
    <>
      <div className="relative z-[100]">
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

        {/* Task J FIX: Notification dropdown - ensure proper z-index and positioning for desktop */}
        {isOpen && (
          <>
            {/* Backdrop overlay to catch clicks and ensure dropdown is above other content */}
            <div 
              className="fixed inset-0 z-[998]" 
              onClick={() => setIsOpen(false)}
            />
            <Card className="fixed sm:absolute top-16 sm:top-12 right-2 sm:right-0 left-2 sm:left-auto w-auto sm:w-[400px] max-w-[calc(100vw-1rem)] z-[999] shadow-2xl border-2 bg-background overflow-visible">
              <CardHeader className="pb-3 border-b bg-muted/30 sticky top-0 z-10">
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
                <ScrollArea className="h-[60vh] sm:h-[450px]">
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
                            } else if (notification.type === 'suspension_request') {
                              markAsRead(notification.id);
                              setIsOpen(false);
                              navigate('/teacher/class-management');
                            } else if (notification.type === 'support_request') {
                              markAsRead(notification.id);
                              setIsOpen(false);
                              navigate('/messages');
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
          </>
        )}
      </div>

      {/* Order Details Dialog - Full Details */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Complete Order Details
            </DialogTitle>
            <DialogDescription>
              Full order information including customer details and delivery preferences
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{selectedOrder.customer_name || 'Unknown'}</p>
                  </div>
                  {selectedOrder.phone_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.phone_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono text-xs truncate">{selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : selectedOrder.status === 'pending' ? 'secondary' : 'outline'} className="text-xs">
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                  <p className="text-xs font-medium flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-bold text-primary text-lg">₦{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              {/* Delivery Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Information
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Delivery Method:</span>
                    <Badge variant={selectedOrder.delivery_address ? 'default' : 'outline'} className="text-sm">
                      {selectedOrder.delivery_address ? '🏠 Home Delivery' : '🏫 School Pickup'}
                    </Badge>
                  </div>
                  
                  {selectedOrder.delivery_address && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                      <p className="text-sm bg-background p-2 rounded border">{selectedOrder.delivery_address}</p>
                    </div>
                  )}
                  
                  {!selectedOrder.delivery_address && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-green-600 font-medium">
                        ✅ Customer will pick up order at school
                      </p>
                    </div>
                  )}
                  
                  {selectedOrder.notes && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Special Instructions / Notes</p>
                      <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items Ordered */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items Ordered ({selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 border">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Unit Price: ₦{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">Qty: {item.quantity}</Badge>
                        <p className="font-semibold text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total Summary */}
              <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Order Total:</span>
                  <span className="text-2xl font-bold text-green-600">₦{selectedOrder.total_amount.toLocaleString()}</span>
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
