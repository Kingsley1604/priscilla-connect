import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Phone, Video, MoreVertical, CheckCheck, Check, Mic, Paperclip, MessageSquare, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import FileUpload from '@/components/chat/FileUpload';
import CallInterface from '@/components/chat/CallInterface';

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
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users from the system
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .neq('id', user.id);

        if (error) throw error;

        // Get roles for each profile
        const usersWithRoles: ChatUser[] = [];
        for (const profile of profiles || []) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          usersWithRoles.push({
            id: profile.id,
            name: profile.name || 'Unknown User',
            email: '',
            avatar: profile.avatar || undefined,
            role: roleData?.role || 'student',
            isOnline: Math.random() > 0.5 // Simulate online status
          });
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
    if (!selectedUser || !user) return;

    // For now, use localStorage to store messages (in production, use Supabase table)
    const storedMessages = localStorage.getItem(`chat_${user.id}_${selectedUser.id}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }
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
      const notification = {
        id: crypto.randomUUID(),
        type: 'content_alert',
        message: `User ${user?.name} used inappropriate language in chat: "${foundWords.join(', ')}"`,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        username: user?.name,
        read: false,
        severity: 'high' as const
      };
      window.dispatchEvent(new CustomEvent('admin-notification', { detail: notification }));
      
      return false;
    }
    return true;
  }, [user]);

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

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage('');
    setContentWarning(null);

    // Store in localStorage (in production, store in Supabase)
    localStorage.setItem(`chat_${user.id}_${selectedUser.id}`, JSON.stringify(updatedMessages));
    localStorage.setItem(`chat_${selectedUser.id}_${user.id}`, JSON.stringify(updatedMessages));

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: true } : m
      ));
    }, 2000);
  };

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
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

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setShowVoiceRecorder(false);

    localStorage.setItem(`chat_${user.id}_${selectedUser.id}`, JSON.stringify(updatedMessages));
    localStorage.setItem(`chat_${selectedUser.id}_${user.id}`, JSON.stringify(updatedMessages));
  };

  const handleSendFile = (file: File, fileInfo: any) => {
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

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setShowFileUpload(false);

    localStorage.setItem(`chat_${user.id}_${selectedUser.id}`, JSON.stringify(updatedMessages));
    localStorage.setItem(`chat_${selectedUser.id}_${user.id}`, JSON.stringify(updatedMessages));
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedUser) return;
    
    setActiveCall({
      contact: selectedUser,
      type,
      status: 'connecting'
    });

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
    }, 1000);

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'active' } : null);
    }, 3000);
  };

  const endCall = () => {
    setActiveCall(null);
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
                      No users found. Other users will appear here when they sign up.
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
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MoreVertical className="h-4 w-4" />
            </Button>
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
