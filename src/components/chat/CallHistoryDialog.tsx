import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone, Video, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CallHistoryItem {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_name?: string;
  receiver_name?: string;
  caller_avatar?: string;
  receiver_avatar?: string;
  call_type: 'audio' | 'video';
  call_status: 'missed' | 'answered' | 'declined';
  call_duration: number;
  started_at: string;
  ended_at?: string;
}

interface CallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: { id: string; name: string; avatar?: string }[];
  onCallBack: (userId: string, type: 'audio' | 'video') => void;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Group calls by user and count missed calls
interface GroupedCall {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastCall: CallHistoryItem;
  missedCount: number;
  totalCalls: number;
  isOutgoing: boolean;
}

const CallHistoryDialog = ({ open, onOpenChange, users, onCallBack }: CallHistoryDialogProps) => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [groupedCalls, setGroupedCalls] = useState<GroupedCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Task L: Fetch call history immediately when dialog opens - no delay
  useEffect(() => {
    if (open && user) {
      // Fetch immediately without delay
      fetchCallHistory();
    }
  }, [open, user]);

  const fetchCallHistory = async () => {
    if (!user) return;
    
    // Task L: Show loading state immediately but don't block UI
    setIsLoading(true);
    setGroupedCalls([]); // Clear previous data for fresh load

    try {
      // Fetch from call_history table - optimized query
      const { data: historyData, error: historyError } = await supabase
        .from('call_history')
        .select('*')
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('started_at', { ascending: false })
        .limit(100);

      // Also fetch from missed_calls for backward compatibility
      const { data: missedData, error: missedError } = await supabase
        .from('missed_calls')
        .select('*')
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      const allCalls: CallHistoryItem[] = [];

      // Add calls from call_history
      if (historyData) {
        historyData.forEach((call: any) => {
          const caller = users.find(u => u.id === call.caller_id);
          const receiver = users.find(u => u.id === call.receiver_id);
          allCalls.push({
            ...call,
            caller_name: caller?.name || 'Unknown',
            receiver_name: receiver?.name || 'Unknown',
            caller_avatar: caller?.avatar,
            receiver_avatar: receiver?.avatar
          });
        });
      }

      // Add missed calls (convert to CallHistoryItem format)
      if (missedData) {
        missedData.forEach((call: any) => {
          // Check if already exists in call_history
          const exists = allCalls.some(c => 
            c.caller_id === call.caller_id && 
            c.receiver_id === call.receiver_id &&
            Math.abs(new Date(c.started_at).getTime() - new Date(call.created_at).getTime()) < 60000
          );
          
          if (!exists) {
            const caller = users.find(u => u.id === call.caller_id);
            const receiver = users.find(u => u.id === call.receiver_id);
            allCalls.push({
              id: call.id,
              caller_id: call.caller_id,
              receiver_id: call.receiver_id,
              caller_name: caller?.name || 'Unknown',
              receiver_name: receiver?.name || 'Unknown',
              caller_avatar: caller?.avatar,
              receiver_avatar: receiver?.avatar,
              call_type: call.call_type as 'audio' | 'video',
              call_status: 'missed',
              call_duration: 0,
              started_at: call.created_at
            });
          }
        });
      }

      // Sort by time
      allCalls.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      setCallHistory(allCalls);

      // Group calls by user
      const grouped: Record<string, GroupedCall> = {};
      
      allCalls.forEach(call => {
        const isOutgoing = call.caller_id === user.id;
        const otherUserId = isOutgoing ? call.receiver_id : call.caller_id;
        const otherUserName = isOutgoing ? call.receiver_name : call.caller_name;
        const otherUserAvatar = isOutgoing ? call.receiver_avatar : call.caller_avatar;
        
        if (!grouped[otherUserId]) {
          grouped[otherUserId] = {
            userId: otherUserId,
            userName: otherUserName || 'Unknown',
            userAvatar: otherUserAvatar,
            lastCall: call,
            missedCount: 0,
            totalCalls: 0,
            isOutgoing
          };
        }
        
        grouped[otherUserId].totalCalls++;
        if (call.call_status === 'missed' && call.receiver_id === user.id) {
          grouped[otherUserId].missedCount++;
        }
      });

      setGroupedCalls(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCallIcon = (call: CallHistoryItem, userId: string) => {
    const isOutgoing = call.caller_id === userId;
    
    if (call.call_status === 'missed') {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500/10 text-green-600';
      case 'missed': return 'bg-destructive/10 text-destructive';
      case 'declined': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
          </DialogTitle>
          <DialogDescription>
            View all your calls - missed, answered, and declined
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : groupedCalls.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No call history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedCalls.map((group) => (
                <div key={group.userId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getCallIcon(group.lastCall, user?.id || '')}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={group.userAvatar} />
                      <AvatarFallback>
                        {group.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{group.userName}</p>
                        {group.missedCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {group.missedCount} missed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={group.lastCall.call_type === 'video' ? '' : ''}>
                          {group.lastCall.call_type === 'video' ? '📹' : '📞'}
                        </span>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(group.lastCall.call_status)}`}>
                          {group.lastCall.call_status}
                        </Badge>
                        {group.lastCall.call_duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(group.lastCall.call_duration)}
                          </span>
                        )}
                        <span>• {formatDate(group.lastCall.started_at)} {formatTime(group.lastCall.started_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group.totalCalls} call{group.totalCalls > 1 ? 's' : ''} total
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onCallBack(group.userId, 'audio')}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onCallBack(group.userId, 'video')}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CallHistoryDialog;
