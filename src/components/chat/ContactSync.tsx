import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnPriscillaChat: boolean;
  lastSeen?: string;
}

interface ContactSyncProps {
  onSyncComplete: (contacts: Contact[]) => void;
}

const ContactSync = ({ onSyncComplete }: ContactSyncProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [step, setStep] = useState<'request' | 'scanning' | 'complete'>('request');

  // Mock contacts data
  const mockContacts: Contact[] = [
    {
      id: '1',
      name: 'Mr. David Thompson',
      phone: '555-0101',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isOnPriscillaChat: true,
      lastSeen: 'online'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      phone: '555-0102',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c4bb2108?w=150&h=150&fit=crop&crop=face',
      isOnPriscillaChat: true,
      lastSeen: '2 hours ago'
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      phone: '555-0103',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      isOnPriscillaChat: true,
      lastSeen: 'yesterday'
    },
    {
      id: '4',
      name: 'Mom',
      phone: '555-0104',
      isOnPriscillaChat: false
    },
    {
      id: '5',
      name: 'John Classmate',
      phone: '555-0105',
      isOnPriscillaChat: true,
      lastSeen: 'online'
    },
    {
      id: '6',
      name: 'Lisa Friend',
      phone: '555-0106',
      isOnPriscillaChat: false
    }
  ];

  const handleStartSync = () => {
    setIsScanning(true);
    setStep('scanning');
    
    // Simulate contact scanning process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setContacts(mockContacts);
          setStep('complete');
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleContinue = () => {
    onSyncComplete(contacts.filter(c => c.isOnPriscillaChat));
  };

  if (step === 'request') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-glow">
          <CardHeader className="text-center">
            <div className="bg-secondary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Find Your Friends</CardTitle>
            <p className="text-muted-foreground">
              We'll check your contacts to see who's already on PriscillaChat
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">What we'll do:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Scan your phone contacts</li>
                <li>• Find friends already using PriscillaChat</li>
                <li>• Show you who you can message</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleStartSync}
              className="w-full bg-gradient-secondary hover:shadow-glow transition-all duration-300"
            >
              Sync My Contacts
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => onSyncComplete([])}
            >
              Skip for Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'scanning') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-glow">
          <CardHeader className="text-center">
            <div className="bg-secondary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-secondary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Syncing Contacts</CardTitle>
            <p className="text-muted-foreground">
              Finding your friends on PriscillaChat...
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {progress}% complete
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="bg-secondary/10 p-3 rounded-full w-fit mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-secondary" />
          </div>
          <CardTitle className="text-2xl">Contacts Synced!</CardTitle>
          <p className="text-muted-foreground">
            Found {contacts.filter(c => c.isOnPriscillaChat).length} friends on PriscillaChat
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  contact.isOnPriscillaChat ? 'bg-secondary/10' : 'bg-muted opacity-60'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.isOnPriscillaChat ? contact.lastSeen : 'Not on PriscillaChat'}
                  </p>
                </div>
                {contact.isOnPriscillaChat && (
                  <Badge variant="secondary" className="bg-secondary/20">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleContinue}
            className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            Start Messaging
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactSync;