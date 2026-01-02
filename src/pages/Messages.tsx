import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Send, Phone, Video, MoreVertical, CheckCheck, Check, Mic, Paperclip, MessageSquare, AlertTriangle, Trash2, PhoneMissed, PhoneIncoming, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import FileUpload from '@/components/chat/FileUpload';
import CallInterface from '@/components/chat/CallInterface';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'voice' | 'file' | 'image';
  is_read: boolean;
  created_at: string;
  file_url?: string;
  file_name?: string;
  is_deleted_by_sender?: boolean;
  is_deleted_by_receiver?: boolean;
}

interface IncomingCall {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
}

interface MissedCall {
  id: string;
  caller_id: string;
  caller_name: string;
  call_type: string;
  created_at: string;
  is_seen: boolean;
}

// Content monitoring - inappropriate words
const INAPPROPRIATE_WORDS = [
  'stupid', 'idiot', 'dumb', 'loser', 'freak', 'ugly', 'fat', 'retard',
  'kill yourself', 'nobody likes you', 'you suck', 'worthless', 'pathetic',
  'sex', 'sexy', 'porn', 'naked', 'nude',
  'scam', 'steal', 'hack', 'password'
];

const Messages = () => {
  const { user } = useAuth();
  const { notifyContentAlert } = useNotificationSystem();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    contact: ChatUser;
    type: 'audio' | 'video';
    status: 'connecting' | 'ringing' | 'active' | 'ended';
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [showMissedCalls, setShowMissedCalls] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users from the system - FIXED to actually get users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        // Get all profiles except current user
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, avatar, phone')
          .neq('id', user.id)
          .not('name', 'is', null);

        if (error) throw error;

        // Get roles for each profile
        const usersWithRoles: ChatUser[] = [];
        
        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id)
              .single();

            if (roleData) {
              usersWithRoles.push({
                id: profile.id,
                name: profile.name || 'Unknown User',
                email: '',
                avatar: profile.avatar || undefined,
                role: roleData.role || 'student',
                isOnline: false
              });
            }
          }
        }

        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Fetch missed calls
  useEffect(() => {
    const fetchMissedCalls = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('missed_calls')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('is_seen', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Get caller names
        const missedCallsWithNames: MissedCall[] = [];
        for (const call of data || []) {
          const caller = users.find(u => u.id === call.caller_id);
          missedCallsWithNames.push({
            ...call,
            caller_name: caller?.name || 'Unknown'
          });
        }
        setMissedCalls(missedCallsWithNames);
      } catch (error) {
        console.error('Error fetching missed calls:', error);
      }
    };

    if (users.length > 0) {
      fetchMissedCalls();
    }
  }, [user, users]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate real-time presence
  useEffect(() => {
    const interval = setInterval(() => {
      const newOnline = new Set<string>();
      users.forEach(u => {
        if (Math.random() > 0.5) newOnline.add(u.id);
      });
      setOnlineUsers(newOnline);
    }, 15000);

    return () => clearInterval(interval);
  }, [users]);

  // Load messages when user is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser || !user) return;

      try {
        // Try to load from Supabase first
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          // Fallback to localStorage
          const storedMessages = localStorage.getItem(`chat_${user.id}_${selectedUser.id}`);
          if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
          } else {
            setMessages([]);
          }
          return;
        }

        // Filter out deleted messages for current user
        const filteredMessages: Message[] = (data || []).filter((msg: any) => {
          if (msg.sender_id === user.id && msg.is_deleted_by_sender) return false;
          if (msg.receiver_id === user.id && msg.is_deleted_by_receiver) return false;
          return true;
        }).map((msg: any) => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'voice' | 'file' | 'image'
        }));

        setMessages(filteredMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedUser, user]);

  // Content monitoring function
  const checkContent = useCallback((content: string): boolean => {
    const lowerContent = content.toLowerCase();
    const foundWords = INAPPROPRIATE_WORDS.filter(word => 
      lowerContent.includes(word.toLowerCase())
    );

    if (foundWords.length > 0) {
      setContentWarning(`Message contains inappropriate content: "${foundWords.join(', ')}". This has been flagged.`);
      
      // Send notification to admin
      notifyContentAlert(user?.name || 'Unknown', foundWords.join(', '));
      
      return false;
    }
    return true;
  }, [user, notifyContentAlert]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    // Check content before sending
    if (!checkContent(newMessage)) {
      toast.error('Message blocked due to inappropriate content');
      return;
    }

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: newMessage,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Store in Supabase
    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        is_read: false
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage('');
    setContentWarning(null);

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: true } : m
      ));
    }, 2000);
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedUser || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: `Voice message (${Math.round(duration)}s)`,
      message_type: 'voice',
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        is_read: false
      });
    } catch (error) {
      console.error('Error saving voice message:', error);
    }

    setMessages(prev => [...prev, message]);
    setShowVoiceRecorder(false);
  };

  const handleSendFile = async (file: File, fileInfo: any) => {
    if (!selectedUser || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: `Sent a file: ${fileInfo.name}`,
      message_type: 'file',
      is_read: false,
      created_at: new Date().toISOString(),
      file_name: fileInfo.name
    };

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        file_name: message.file_name,
        is_read: false
      });
    } catch (error) {
      console.error('Error saving file message:', error);
    }

    setMessages(prev => [...prev, message]);
    setShowFileUpload(false);
  };

  const handleDeleteChat = async () => {
    if (!selectedUser || !user) return;

    try {
      // Soft delete - mark messages as deleted for current user
      await supabase
        .from('chat_messages')
        .update({ is_deleted_by_sender: true })
        .eq('sender_id', user.id)
        .eq('receiver_id', selectedUser.id);

      await supabase
        .from('chat_messages')
        .update({ is_deleted_by_receiver: true })
        .eq('sender_id', selectedUser.id)
        .eq('receiver_id', user.id);

      setMessages([]);
      setShowDeleteDialog(false);
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedUser) return;
    
    // Check if user is online
    if (!onlineUsers.has(selectedUser.id)) {
      // Create missed call record
      supabase.from('missed_calls').insert({
        caller_id: user?.id,
        receiver_id: selectedUser.id,
        call_type: type
      }).then(() => {
        toast.info(`${selectedUser.name} is offline. They will see a missed call notification.`);
      });
      return;
    }

    setActiveCall({
      contact: selectedUser,
      type,
      status: 'connecting'
    });

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
    }, 1000);
  };

  const answerCall = () => {
    if (!incomingCall) return;

    const caller = users.find(u => u.id === incomingCall.callerId);
    if (!caller) return;

    setActiveCall({
      contact: caller,
      type: incomingCall.callType,
      status: 'active'
    });
    setIncomingCall(null);
  };

  const declineCall = async () => {
    if (!incomingCall || !user) return;

    // Record as missed call
    try {
      await supabase.from('missed_calls').insert({
        caller_id: incomingCall.callerId,
        receiver_id: user.id,
        call_type: incomingCall.callType
      });
    } catch (error) {
      console.error('Error recording missed call:', error);
    }

    setIncomingCall(null);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const markMissedCallsSeen = async () => {
    if (!user) return;

    try {
      await supabase
        .from('missed_calls')
        .update({ is_seen: true })
        .eq('receiver_id', user.id)
        .eq('is_seen', false);

      setMissedCalls([]);
      setShowMissedCalls(false);
    } catch (error) {
      console.error('Error marking missed calls as seen:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'teacher': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Priscilla Chat</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Priscilla Chat...</p>
        </div>
      </div>
    );
  }

  // Contact list view
  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-gradient-hero text-white py-4 px-4 sm:py-6 sm:px-6 shadow-medium sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 px-2 sm:px-3">
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                  </Button>
                </Link>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold">Priscilla Chat</h1>
                  <p className="text-white/80 text-xs sm:text-sm">Connect with teachers, students & admins</p>
                </div>
              </div>
              
              {/* Missed Calls Button */}
              {missedCalls.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 relative"
                  onClick={() => setShowMissedCalls(true)}
                >
                  <PhoneMissed className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs h-5 w-5 p-0 flex items-center justify-center">
                    {missedCalls.length}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </header>

        <section className="py-4 sm:py-6 px-4 sm:px-6 flex-1">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Card className="shadow-soft">
              <CardHeader className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold">Available Users</h2>
                <p className="text-sm text-muted-foreground">{users.length} users on Priscilla Chat</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      {users.length === 0 
                        ? "No other users found. Users will appear here once they complete their profile."
                        : "No users match your search."}
                    </div>
                  ) : (
                    filteredUsers.map((chatUser) => (
                      <div
                        key={chatUser.id}
                        className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUser(chatUser)}
                      >
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={chatUser.avatar} />
                          <AvatarFallback className="text-sm">
                            {chatUser.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-foreground text-sm sm:text-base truncate">{chatUser.name}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={getRoleBadgeColor(chatUser.role)} variant="secondary">
                                {chatUser.role}
                              </Badge>
                              {onlineUsers.has(chatUser.id) && (
                                <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                                  Online
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            Click to start chatting
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Missed Calls Dialog */}
        <Dialog open={showMissedCalls} onOpenChange={setShowMissedCalls}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PhoneMissed className="h-5 w-5 text-destructive" />
                Missed Calls
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {missedCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <PhoneIncoming className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="font-medium">{call.caller_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {call.call_type} call • {new Date(call.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={markMissedCallsSeen}>Mark all as seen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Chat view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-gradient-hero text-white py-4 px-6 shadow-medium sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback>
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{selectedUser.name}</h2>
              <Badge className={getRoleBadgeColor(selectedUser.role)} variant="secondary">
                {selectedUser.role}
              </Badge>
            </div>
            <p className="text-sm text-white/80">
              {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => startCall('audio')}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => startCall('video')}
            >
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content Warning */}
      {contentWarning && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{contentWarning}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-destructive"
            onClick={() => setContentWarning(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender_id === user.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    message.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    <span className="text-xs">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.sender_id === user.id && (
                      message.is_read 
                        ? <CheckCheck className="h-3 w-3" />
                        : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        {showVoiceRecorder && (
          <div className="mb-3">
            <VoiceRecorder 
              onSendVoiceMessage={handleSendVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}
        
        {showFileUpload && (
          <div className="mb-3">
            <FileUpload 
              onSendFile={handleSendFile}
              onCancel={() => setShowFileUpload(false)}
            />
          </div>
        )}

        {!showVoiceRecorder && !showFileUpload && (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Delete Chat Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this chat? The messages will be hidden from your view but kept for security purposes.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteChat}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incoming Call Dialog */}
      {incomingCall && (
        <Dialog open={!!incomingCall} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Incoming {incomingCall.callType} Call</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-2xl">
                  {incomingCall.callerName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <p className="text-xl font-semibold">{incomingCall.callerName}</p>
              <p className="text-muted-foreground">{incomingCall.callType === 'video' ? 'Video' : 'Audio'} call</p>
            </div>
            <DialogFooter className="flex justify-center gap-4">
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={declineCall}
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                onClick={answerCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Call Interface */}
      {activeCall && (
        <CallInterface
          contact={{
            id: activeCall.contact.id,
            name: activeCall.contact.name,
            phone: '',
            avatar: activeCall.contact.avatar
          }}
          callType={activeCall.type}
          callStatus={activeCall.status}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

export default Messages;
