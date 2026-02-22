import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MoreVertical, CheckCheck, Check, Mic, Paperclip, Phone, Video, Play, Download, FileText, Image as ImageIcon, Music, VideoIcon, ArrowDown } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import FileUpload from './FileUpload';
import CallInterface from './CallInterface';
import MessageBubble from './MessageBubble';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnPriscillaChat: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  text?: string;
  timestamp: Date;
  isSent: boolean;
  isDelivered: boolean;
  isRead: boolean;
  type: 'text' | 'voice' | 'file' | 'image' | 'video' | 'audio';
  voiceData?: {
    audioBlob: Blob;
    duration: number;
  };
  fileData?: {
    file: File;
    name: string;
    size: string;
    fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  };
}

interface ChatInterfaceProps {
  contacts: Contact[];
  currentUser: { phone: string; name: string };
}

const ChatInterface = ({ contacts, currentUser }: ChatInterfaceProps) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    contact: Contact;
    type: 'audio' | 'video';
    status: 'connecting' | 'ringing' | 'active' | 'ended';
  } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set(['1', '2']));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  // Mock messages for demo
  const mockMessages: Record<string, Message[]> = {
    '1': [
      {
        id: '1',
        text: 'Hi! How are you doing with the calculus homework?',
        timestamp: new Date(Date.now() - 3600000),
        isSent: false,
        isDelivered: true,
        isRead: true,
        type: 'text'
      },
      {
        id: '2',
        text: 'I\'m working through it now. The integration problems are challenging!',
        timestamp: new Date(Date.now() - 3500000),
        isSent: true,
        isDelivered: true,
        isRead: true,
        type: 'text'
      },
      {
        id: '3',
        text: 'Great work on your assignment! Your understanding of calculus has improved significantly.',
        timestamp: new Date(Date.now() - 1800000),
        isSent: false,
        isDelivered: true,
        isRead: true,
        type: 'text'
      }
    ],
    '2': [
      {
        id: '4',
        text: 'Hey! Are you coming to the study group tomorrow?',
        timestamp: new Date(Date.now() - 7200000),
        isSent: false,
        isDelivered: true,
        isRead: true,
        type: 'text'
      },
      {
        id: '5',
        text: 'Yes! What time is it again?',
        timestamp: new Date(Date.now() - 7000000),
        isSent: true,
        isDelivered: true,
        isRead: true,
        type: 'text'
      }
    ]
  };

  useEffect(() => {
    if (selectedContact) {
      setMessages(mockMessages[selectedContact.id] || []);
    }
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 150);
  }, []);

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulate real-time messaging
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate online status updates
      const randomContacts = contacts.filter(() => Math.random() > 0.7);
      const newOnlineUsers = new Set<string>();
      randomContacts.forEach(contact => newOnlineUsers.add(contact.id));
      setOnlineUsers(newOnlineUsers);
    }, 10000);

    return () => clearInterval(interval);
  }, [contacts]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      timestamp: new Date(),
      isSent: true,
      isDelivered: false,
      isRead: false,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate delivery and read status
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isDelivered: true } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isRead: true } : msg
      ));
    }, 3000);
  };

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (!selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      timestamp: new Date(),
      isSent: true,
      isDelivered: false,
      isRead: false,
      type: 'voice',
      voiceData: {
        audioBlob,
        duration
      }
    };

    setMessages(prev => [...prev, message]);
    setShowVoiceRecorder(false);

    // Simulate delivery and read status
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isDelivered: true } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isRead: true } : msg
      ));
    }, 3000);
  };

  const handleSendFile = (file: File, fileInfo: any) => {
    if (!selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      timestamp: new Date(),
      isSent: true,
      isDelivered: false,
      isRead: false,
      type: 'file',
      fileData: {
        file,
        name: fileInfo.name,
        size: fileInfo.size,
        fileType: fileInfo.type
      }
    };

    setMessages(prev => [...prev, message]);
    setShowFileUpload(false);

    // Simulate delivery and read status
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isDelivered: true } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, isRead: true } : msg
      ));
    }, 3000);
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedContact) return;
    
    setActiveCall({
      contact: selectedContact,
      type,
      status: 'connecting'
    });

    // Simulate call progression
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

  const getLastMessage = (contact: Contact) => {
    const contactMessages = mockMessages[contact.id] || [];
    if (contactMessages.length === 0) return 'Start a conversation';
    const lastMsg = contactMessages[contactMessages.length - 1];
    
    if (lastMsg.type === 'voice') return '🎵 Voice message';
    if (lastMsg.type === 'file') return '📎 File';
    if (lastMsg.type === 'image') return '🖼️ Image';
    if (lastMsg.type === 'video') return '🎥 Video';
    if (lastMsg.type === 'audio') return '🎵 Audio';
    
    return lastMsg.text && lastMsg.text.length > 50 ? lastMsg.text.substring(0, 50) + '...' : lastMsg.text || '';
  };

  const getStatusIndicator = (message: Message) => {
    if (!message.isSent) return null;
    if (message.isRead) return <CheckCheck className="h-4 w-4 text-primary" />;
    if (message.isDelivered) return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
    return <Check className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedContact) {
    return (
      <div className="bg-background">
        {/* Contacts List - No duplicate header */}
        <section className="py-4 sm:py-6 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Card className="shadow-soft">
              <CardHeader className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold">Your Contacts</h2>
                <p className="text-sm text-muted-foreground">{contacts.length} friends on PriscillaChat</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="text-sm">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{contact.name}</p>
                          <div className="flex items-center flex-shrink-0">
                            {(contact.lastSeen === 'online' || onlineUsers.has(contact.id)) && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                                Online
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {getLastMessage(contact)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last seen: {contact.lastSeen}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Chat Header */}
      <header className="bg-gradient-hero text-white py-4 px-6 shadow-medium">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setSelectedContact(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedContact.avatar} />
            <AvatarFallback>
              {selectedContact.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold">{selectedContact.name}</h2>
            <p className="text-sm text-white/80">
              {(selectedContact.lastSeen === 'online' || onlineUsers.has(selectedContact.id)) ? 'Online' : `Last seen ${selectedContact.lastSeen}`}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative" ref={messagesContainerRef} onScroll={handleScroll}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              getStatusIndicator={getStatusIndicator}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Jump to Latest Button - inside scroll container */}
        {showJumpToLatest && (
          <div className="sticky bottom-4 flex justify-end pr-4 pointer-events-none">
            <Button
              onClick={scrollToLatest}
              size="sm"
              className="rounded-full shadow-lg bg-primary hover:bg-primary/90 h-10 w-10 p-0 pointer-events-auto"
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

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
          contact={activeCall.contact}
          callType={activeCall.type}
          callStatus={activeCall.status}
          onEndCall={endCall}
        />
      )}
    </div>
  );
};

export default ChatInterface;