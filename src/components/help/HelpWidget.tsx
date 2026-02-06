import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, X, Bot, User, Minimize2, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import helpSupportIcon from '@/assets/priscilla-help-icon.png';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'human';
  timestamp: Date;
}

// AI responses for common issues
const aiResponses: Record<string, string> = {
  '404': "It looks like you're experiencing a 404 error. This means the page you're looking for doesn't exist. Try navigating back to the dashboard and checking the URL. If the issue persists, please try refreshing the page.",
  'error': "I understand you're experiencing an error. Here are some steps to try:\n1. Refresh the page\n2. Clear your browser cache\n3. Log out and log back in\n4. If the issue persists, please describe the error in detail and our human support team will assist you.",
  'refresh': "Try refreshing your browser page (Ctrl+R or Cmd+R). This often resolves temporary issues. If the problem continues, clear your browser cache and cookies.",
  'login': "Having trouble logging in? Make sure you're using the correct email and password. If you forgot your password, use the 'Forgot Password' link on the login page.",
  'password': "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a reset link.",
  'slow': "If the app is running slowly, try:\n1. Refresh the page\n2. Clear browser cache\n3. Close other browser tabs\n4. Check your internet connection",
  'upload': "Having trouble uploading files? Make sure your file is under 50MB and in a supported format (images, PDFs, documents). Try refreshing and attempting the upload again.",
  'chat': "For chat issues, try refreshing the page. Make sure you have a stable internet connection. Messages are sent in real-time, so a good connection is important.",
  'result': "For issues with viewing or uploading results, make sure you're logged in as the correct user type (teacher or admin). Class teachers can only upload results for their assigned classes.",
  'class': "If you're having trouble with class management, make sure you're assigned as a class teacher. Only class teachers can manage students and upload results for their classes.",
  'default': "I'm here to help! Please describe your issue and I'll do my best to assist. For complex issues, our human support team is also available."
};

const getAIResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, response] of Object.entries(aiResponses)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  return aiResponses.default;
};

const HelpWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm the Priscilla Connect support assistant. How can I help you today? I can assist with common issues like 404 errors, login problems, or slow loading. For complex issues, I can connect you with our support team.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isHumanOnline] = useState(true);
  const [needsHumanHelp, setNeedsHumanHelp] = useState(false);
  const [isConnectingToSupport, setIsConnectingToSupport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pages where help widget should be hidden
  const hiddenPaths = [
    '/messages',
    '/teacher/create-questions',
    '/teacher/exam-overview',
    '/teacher/lesson-planner',
    '/teacher/class-management',
    '/student/exam',
    '/priscilla-brain',
    '/admin/super-admin'
  ];

  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  // Hide for super admin portal
  const isSuperAdmin = user?.is_super_admin === true;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = newMessage;
    setNewMessage('');

    // AI responds after a short delay
    setTimeout(() => {
      const aiResponseText = getAIResponse(userInput);
      
      const needsHuman = userInput.toLowerCase().includes('not working') || 
                         userInput.toLowerCase().includes('still broken') ||
                         userInput.toLowerCase().includes('help me') ||
                         aiResponseText === aiResponses.default;
      
      if (needsHuman && !needsHumanHelp) {
        setNeedsHumanHelp(true);
      }
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        content: aiResponseText + (needsHuman ? "\n\n💡 If this doesn't solve your issue, click 'Connect to Support' below to chat with our team directly." : ""),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  // Task L: Connect to super admin via Priscilla Chat
  const handleConnectToHuman = async () => {
    if (!user) {
      toast.error('Please log in to connect to support');
      return;
    }

    setIsConnectingToSupport(true);
    
    try {
      // Find the super admin
      const { data: superAdminProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_super_admin', true)
        .maybeSingle();

      if (!superAdminProfile) {
        const connectMessage: Message = {
          id: crypto.randomUUID(),
          content: "Our support team is currently unavailable. Please try again later or leave a detailed message describing your issue.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, connectMessage]);
        setIsConnectingToSupport(false);
        return;
      }

      // Collect the conversation so far to send to super admin
      const conversationSummary = messages
        .filter(m => m.sender === 'user')
        .map(m => m.content)
        .join('\n');

      const supportMessage = `🆘 Support Request from ${user.name || 'User'}:\n\n${conversationSummary || 'User needs assistance'}`;

      // Send message to super admin via Priscilla Chat
      await supabase.from('chat_messages').insert({
        sender_id: user.id,
        receiver_id: superAdminProfile.id,
        content: supportMessage,
        message_type: 'text',
        is_read: false
      });

      // Create admin notification for the super admin
      await supabase.from('admin_notifications').insert({
        title: 'Support Request',
        message: `${user.name || 'A user'} needs help via the support widget. Click to view in Priscilla Chat.`,
        type: 'support_request',
        target_admin_id: superAdminProfile.id
      });

      const connectMessage: Message = {
        id: crypto.randomUUID(),
        content: `I've connected you to our support team (${superAdminProfile.name || 'Super Admin'}). Your conversation has been sent to them via Priscilla Chat. They will respond shortly. You can also check your Priscilla Chat messages for their reply.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, connectMessage]);
      setNeedsHumanHelp(false);
      toast.success('Support request sent! Check Priscilla Chat for the response.');
    } catch (error) {
      console.error('Error connecting to support:', error);
      toast.error('Failed to connect to support. Please try again.');
    } finally {
      setIsConnectingToSupport(false);
    }
  };

  const toggleWidget = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Don't render on hidden pages or for super admin
  if (shouldHide || isSuperAdmin) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleWidget}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0"
        title="Support"
      >
        <img 
          src={helpSupportIcon} 
          alt="Support" 
          className="h-8 w-8 object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        {isHumanOnline && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0"
        title="Support"
      >
        <img 
          src={helpSupportIcon} 
          alt="Support" 
          className="h-8 w-8 object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        {isHumanOnline && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 shadow-xl border-2">
      <CardHeader className="py-3 px-4 bg-gradient-hero text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={helpSupportIcon} alt="Support" className="h-5 w-5" style={{ filter: 'brightness(0) invert(1)' }} />
            <CardTitle className="text-sm font-semibold">Priscilla Support</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${isHumanOnline ? 'bg-green-500/20 text-green-100' : 'bg-yellow-500/20 text-yellow-100'}`}
            >
              {isHumanOnline ? "We're Online!" : 'Leave a message'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72 p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                      {msg.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t space-y-2">
          {needsHumanHelp && (
            <Button 
              onClick={handleConnectToHuman}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
              disabled={isConnectingToSupport}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isConnectingToSupport ? 'Connecting...' : 'Connect to Support Team'}
            </Button>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Describe your issue..."
              className="flex-1 text-sm"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center">
            {isHumanOnline ? "We're online! Get help now." : "Leave a message, we'll respond soon."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpWidget;
