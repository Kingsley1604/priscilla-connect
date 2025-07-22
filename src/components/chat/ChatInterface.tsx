import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MoreVertical, CheckCheck, Check } from 'lucide-react';

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
  text: string;
  timestamp: Date;
  isSent: boolean;
  isDelivered: boolean;
  isRead: boolean;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demo
  const mockMessages: Record<string, Message[]> = {
    '1': [
      {
        id: '1',
        text: 'Hi! How are you doing with the calculus homework?',
        timestamp: new Date(Date.now() - 3600000),
        isSent: false,
        isDelivered: true,
        isRead: true
      },
      {
        id: '2',
        text: 'I\'m working through it now. The integration problems are challenging!',
        timestamp: new Date(Date.now() - 3500000),
        isSent: true,
        isDelivered: true,
        isRead: true
      },
      {
        id: '3',
        text: 'Great work on your assignment! Your understanding of calculus has improved significantly.',
        timestamp: new Date(Date.now() - 1800000),
        isSent: false,
        isDelivered: true,
        isRead: true
      }
    ],
    '2': [
      {
        id: '4',
        text: 'Hey! Are you coming to the study group tomorrow?',
        timestamp: new Date(Date.now() - 7200000),
        isSent: false,
        isDelivered: true,
        isRead: true
      },
      {
        id: '5',
        text: 'Yes! What time is it again?',
        timestamp: new Date(Date.now() - 7000000),
        isSent: true,
        isDelivered: true,
        isRead: true
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      timestamp: new Date(),
      isSent: true,
      isDelivered: false,
      isRead: false
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

  const getLastMessage = (contact: Contact) => {
    const contactMessages = mockMessages[contact.id] || [];
    if (contactMessages.length === 0) return 'Start a conversation';
    const lastMsg = contactMessages[contactMessages.length - 1];
    return lastMsg.text.length > 50 ? lastMsg.text.substring(0, 50) + '...' : lastMsg.text;
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center">
                  <span className="text-lg font-bold">P</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">PriscillaChat</h1>
                <p className="text-white/90">Simple. Fast. Free.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contacts List */}
        <section className="py-6 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <Card className="shadow-soft">
              <CardHeader>
                <h2 className="text-xl font-semibold">Your Contacts</h2>
                <p className="text-muted-foreground">{contacts.length} friends on PriscillaChat</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{contact.name}</p>
                          <div className="flex items-center space-x-2">
                            {contact.lastSeen === 'online' && (
                              <Badge variant="secondary" className="bg-secondary/20 text-xs">
                                Online
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
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
    <div className="min-h-screen bg-background flex flex-col">
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
              {selectedContact.lastSeen === 'online' ? 'Online' : `Last seen ${selectedContact.lastSeen}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isSent 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-foreground'
            }`}>
              <p className="text-sm">{message.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {getStatusIndicator(message)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;