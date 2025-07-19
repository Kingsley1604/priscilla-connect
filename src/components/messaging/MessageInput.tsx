import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warning, setWarning] = useState('');
  const { user } = useAuth();
  const { monitorContent } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setIsSubmitting(true);
    setWarning('');

    // Monitor content for inappropriate keywords
    const inappropriateKeywords = [
      'stupid', 'idiot', 'dumb', 'loser', 'freak', 'ugly', 'fat',
      'kill yourself', 'nobody likes you', 'you suck', 'worthless', 'pathetic',
      'sex', 'sexy', 'porn', 'naked', 'nude',
      'scam', 'steal', 'hack', 'password', 'credit card'
    ];

    const foundKeywords = inappropriateKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      setWarning(`Warning: Your message contains inappropriate content: "${foundKeywords.join(', ')}"`);
      
      // Send notification to admin
      monitorContent(message, user.id, user.name);
      
      setIsSubmitting(false);
      return;
    }

    // Simulate sending message
    setTimeout(() => {
      setMessage('');
      setIsSubmitting(false);
      // Here you would normally send the message to your backend
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send a Message
          <small className="text-muted-foreground font-normal ml-2">
            (Demo: Content monitoring active)
          </small>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {warning && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          <Textarea
            placeholder="Type your message here... (Try words like 'stupid' or 'scam' to see content monitoring)"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (warning) setWarning(''); // Clear warning when user starts typing
            }}
            rows={4}
            className="resize-none"
          />
          
          <Button 
            type="submit" 
            disabled={!message.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Demo Feature:</strong> This message input demonstrates real-time content monitoring. 
            Try typing inappropriate words and see how the system alerts administrators.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageInput;