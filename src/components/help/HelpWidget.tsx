import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, X, Bot, User, Minimize2, MessageCircle, PhoneOff, Headphones } from 'lucide-react';
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
  senderName?: string;
}

interface SupportSession {
  isActive: boolean;
  superAdminId: string | null;
  superAdminName: string | null;
  startedAt: Date | null;
}

// AI responses for common issues - strictly guidance only, NO code
const aiResponses: Record<string, string> = {
  '404': "It looks like you're experiencing a 404 error. This means the page you're looking for doesn't exist. Try navigating back to the dashboard and checking the URL. If the issue persists, please try refreshing the page.",
  'error': "I understand you're experiencing an error. Here are some steps to try:\n1. Refresh the page\n2. Clear your browser cache\n3. Log out and log back in\n4. If the issue persists, please describe the error in detail.",
  'refresh': "Try refreshing your browser page (Ctrl+R or Cmd+R). This often resolves temporary issues. If the problem continues, clear your browser cache and cookies.",
  'login': "Having trouble logging in? Make sure you're using the correct email and password. If you forgot your password, use the 'Forgot Password' link on the login page.",
  'password': "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a reset link.",
  'slow': "If the app is running slowly, try:\n1. Refresh the page\n2. Clear browser cache\n3. Close other browser tabs\n4. Check your internet connection",
  'upload': "Having trouble uploading files? Make sure your file is under 50MB and in a supported format (images, PDFs, documents). Try refreshing and attempting the upload again.",
  'chat': "For chat issues, try refreshing the page. Make sure you have a stable internet connection. Messages are sent in real-time, so a good connection is important.",
  'result': "For issues with viewing or uploading results, make sure you're logged in as the correct user type (teacher or admin). Class teachers can only upload results for their assigned classes.",
  'class': "If you're having trouble with class management, make sure you're assigned as a class teacher. Only class teachers can manage students and upload results for their classes.",
  'code': "I'm sorry, but I cannot generate, edit, or execute any code. I can only provide guidance and explanations. For coding-related changes, please contact the development team.",
  'default': "I'm here to help! Please describe your issue and I'll do my best to assist with guidance and explanations. Note: I cannot generate or modify any code within the software."
};

const getAIResponse = (message: string): { response: string; needsEscalation: boolean } => {
  const lowerMessage = message.toLowerCase();
  
  // Check if user is asking for code/development work - AI must refuse
  const codeKeywords = ['write code', 'fix code', 'create function', 'add feature', 'implement', 'develop', 'program', 'script'];
  if (codeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return {
      response: "I'm sorry, but I cannot generate, edit, or execute any code within the software. I'm limited to providing guidance, explanations, and answering questions. For development requests, please contact the development team directly.",
      needsEscalation: false
    };
  }
  
  for (const [key, response] of Object.entries(aiResponses)) {
    if (lowerMessage.includes(key)) {
      return { response, needsEscalation: false };
    }
  }
  
  // Check if the issue seems unresolvable by AI
  const escalationTriggers = ['not working', 'still broken', 'urgent', 'critical', 'please help', 'need help', 'cannot access', 'blocked'];
  const needsEscalation = escalationTriggers.some(trigger => lowerMessage.includes(trigger));
  
  return { 
    response: aiResponses.default,
    needsEscalation
  };
};

const HelpWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm the Priscilla Connect support assistant. How can I help you today? I can assist with common issues like 404 errors, login problems, or slow loading.\n\n⚠️ Note: I can only provide guidance and explanations. I cannot generate, edit, or execute any code.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [supportSession, setSupportSession] = useState<SupportSession>({
    isActive: false,
    superAdminId: null,
    superAdminName: null,
    startedAt: null
  });
  const [showEscalateButton, setShowEscalateButton] = useState(false);
  const [isConnectingToSupport, setIsConnectingToSupport] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pages where help widget should be COMPLETELY hidden
  const hiddenPaths = [
    '/messages',
    '/teacher/create-questions',
    '/teacher/exam-overview',
    '/teacher/lesson-planner',
    '/student/exam',
    '/priscilla-brain',
    '/admin/super-admin',
    '/teacher/midterm-report',          // Result templates
    '/teacher/nursery-one-exam',         // Result templates
    '/teacher/nursery-two-exam',         // Result templates
    '/teacher/nursery-midterm-report',   // Result templates
    '/teacher/secondary-exam-result',    // Result templates
    '/teacher/secondary-result-upload',  // Result templates
    '/teacher/report-card',              // Result templates
    '/reports/exam-result',              // Result pages
    '/reports/midterm-result',           // Result pages
    '/reports/entrance-result'           // Result pages
  ];

  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  // Hide if user is not logged in (check auth state)
  const isLoggedIn = !!user?.id;

  // Hide on the role selection page (Index page when showing role selection)
  const isRoleSelectionPage = location.pathname === '/' || location.pathname === '/forgot-password';

  // Hide for super admin portal
  const isSuperAdmin = user?.is_super_admin === true;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for messages from support team (super admin)
  useEffect(() => {
    if (!user?.id || !supportSession.isActive || !supportSession.superAdminId) return;

    const channel = supabase
      .channel(`support-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Only add messages from super admin during active session
          if (newMsg.sender_id === supportSession.superAdminId) {
            const humanMessage: Message = {
              id: newMsg.id,
              content: newMsg.content,
              sender: 'human',
              timestamp: new Date(newMsg.created_at),
              senderName: 'Support Team'
            };
            setMessages(prev => [...prev, humanMessage]);
            setHasUnreadMessages(true);
            
            // Mark message as read
            supabase
              .from('chat_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supportSession.isActive, supportSession.superAdminId]);

  // Check for unread support messages on mount
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (!user?.id) return;

      // Find super admin
      const { data: superAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_super_admin', true)
        .maybeSingle();

      if (superAdmin) {
        const { data: unread } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('receiver_id', user.id)
          .eq('sender_id', superAdmin.id)
          .eq('is_read', false)
          .limit(1);

        if (unread && unread.length > 0) {
          setHasUnreadMessages(true);
        }
      }
    };

    checkUnreadMessages();
  }, [user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
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

    // If in human support session, send to super admin
    if (supportSession.isActive && supportSession.superAdminId) {
      try {
        await supabase.from('chat_messages').insert({
          sender_id: user!.id,
          receiver_id: supportSession.superAdminId,
          content: userInput,
          message_type: 'text',
          is_read: false
        });
      } catch (error) {
        console.error('Error sending message to support:', error);
        toast.error('Failed to send message. Please try again.');
      }
      return; // Don't add AI response during human support
    }

    // AI responds after a short delay
    setTimeout(() => {
      const { response, needsEscalation } = getAIResponse(userInput);
      
      if (needsEscalation && !showEscalateButton) {
        setShowEscalateButton(true);
      }
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        content: response + (needsEscalation ? "\n\n💡 If this doesn't solve your issue, you can click 'Connect to Support Team' below to chat with our human support team." : ""),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

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
          content: "Our support team is currently unavailable. Please try again later or describe your issue in detail and we'll get back to you.",
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

      // Create admin notification with distinct support_request type
      await supabase.from('admin_notifications').insert({
        title: 'Support Request',
        message: `${user.name || 'A user'} needs help via the support widget. Click to view in Priscilla Chat.`,
        type: 'support_request',
        target_admin_id: superAdminProfile.id
      });

      // Start human support session
      setSupportSession({
        isActive: true,
        superAdminId: superAdminProfile.id,
        superAdminName: superAdminProfile.name || 'Support Team',
        startedAt: new Date()
      });

      const connectMessage: Message = {
        id: crypto.randomUUID(),
        content: `You are now connected to our Support Team. They will respond to your messages here. You can end this session at any time by clicking 'End Chat'.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, connectMessage]);
      setShowEscalateButton(false);
      toast.success('Connected to Support Team!');
    } catch (error) {
      console.error('Error connecting to support:', error);
      toast.error('Failed to connect to support. Please try again.');
    } finally {
      setIsConnectingToSupport(false);
    }
  };

  const handleEndChat = async () => {
    if (!supportSession.isActive) {
      // Just reset AI chat
      setMessages([{
        id: crypto.randomUUID(),
        content: "Chat ended. Starting a new session...\n\nHi! I'm the Priscilla Connect support assistant. How can I help you today?\n\n⚠️ Note: I can only provide guidance and explanations. I cannot generate, edit, or execute any code.",
        sender: 'ai',
        timestamp: new Date()
      }]);
      setShowEscalateButton(false);
      toast.success('Conversation ended. You can start a new session.');
      return;
    }

    // Notify super admin that chat ended
    if (supportSession.superAdminId && user) {
      try {
        await supabase.from('chat_messages').insert({
          sender_id: user.id,
          receiver_id: supportSession.superAdminId,
          content: '--- User ended the support session ---',
          message_type: 'text',
          is_read: false
        });
      } catch (error) {
        console.error('Error notifying end of session:', error);
      }
    }

    // Reset session
    setSupportSession({
      isActive: false,
      superAdminId: null,
      superAdminName: null,
      startedAt: null
    });

    const endMessage: Message = {
      id: crypto.randomUUID(),
      content: "✅ Conversation ended. Thank you for contacting support!\n\nStarting a new AI support session...\n\nHi! I'm the Priscilla Connect support assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages([endMessage]);
    setShowEscalateButton(false);
    toast.success('Conversation ended successfully.');
  };

  const toggleWidget = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
    if (!isOpen) {
      setHasUnreadMessages(false);
    }
  };

  // Don't render on hidden pages, for super admin, if not logged in, or on role selection page
  if (shouldHide || isSuperAdmin || !isLoggedIn || isRoleSelectionPage) {
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
        />
        {/* Unread message indicator */}
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </span>
        )}
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => {
          setIsMinimized(false);
          setHasUnreadMessages(false);
        }}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0"
        title="Support"
      >
        <img 
          src={helpSupportIcon} 
          alt="Support" 
          className="h-8 w-8 object-contain"
        />
        {hasUnreadMessages && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </span>
        )}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 shadow-xl border-2">
      <CardHeader className="py-3 px-4 bg-gradient-hero text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            <CardTitle className="text-sm font-semibold">
              {supportSession.isActive ? 'Support Team' : 'Priscilla Support'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${supportSession.isActive ? 'bg-blue-500/20 text-blue-100' : 'bg-green-500/20 text-green-100'}`}
            >
              {supportSession.isActive ? "Human Support" : "AI Assistant"}
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
                    <AvatarFallback className={
                      msg.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.sender === 'human'
                        ? 'bg-blue-500 text-white'
                        : 'bg-secondary'
                    }>
                      {msg.sender === 'user' ? <User className="h-3 w-3" /> : 
                       msg.sender === 'human' ? <Headphones className="h-3 w-3" /> :
                       <Bot className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : msg.sender === 'human'
                        ? 'bg-blue-100 dark:bg-blue-900/50'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.sender === 'human' && (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block mb-1">
                        Support Team
                      </span>
                    )}
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
          {/* Connect to Support button - only show when AI suggests escalation and not already in human session */}
          {showEscalateButton && !supportSession.isActive && (
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

          {/* End Chat button - always visible */}
          <Button 
            onClick={handleEndChat}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            size="sm"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Chat
          </Button>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={supportSession.isActive ? "Message Support Team..." : "Describe your issue..."}
              className="flex-1 text-sm"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center">
            {supportSession.isActive 
              ? "You're chatting with our Support Team" 
              : "AI assistant - guidance only, no code execution"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpWidget;