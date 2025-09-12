import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PhoneRegistration from '@/components/chat/PhoneRegistration';
import ContactSync from '@/components/chat/ContactSync';
import ChatInterfaceWithHeader from '@/components/chat/ChatInterfaceWithHeader';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnPriscillaChat: boolean;
  lastSeen?: string;
}

interface ChatUser {
  phone: string;
  name: string;
  isRegistered: boolean;
  contacts: Contact[];
}

const Messages = () => {
  const { user } = useAuth();
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [step, setStep] = useState<'registration' | 'sync' | 'chat'>('registration');

  useEffect(() => {
    // Check if user has already registered for PriscillaChat
    const savedChatUser = localStorage.getItem('priscillaChat_user');
    if (savedChatUser) {
      const parsedUser = JSON.parse(savedChatUser);
      setChatUser(parsedUser);
      setStep(parsedUser.contacts.length > 0 ? 'chat' : 'sync');
    }
  }, []);

  const handleRegistrationComplete = (phoneNumber: string) => {
    const newChatUser: ChatUser = {
      phone: phoneNumber,
      name: user?.name || 'User',
      isRegistered: true,
      contacts: []
    };
    setChatUser(newChatUser);
    localStorage.setItem('priscillaChat_user', JSON.stringify(newChatUser));
    setStep('sync');
  };

  const handleSyncComplete = (contacts: Contact[]) => {
    if (chatUser) {
      const updatedUser = { ...chatUser, contacts };
      setChatUser(updatedUser);
      localStorage.setItem('priscillaChat_user', JSON.stringify(updatedUser));
    }
    setStep('chat');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Please log in to access PriscillaChat</h1>
        </div>
      </div>
    );
  }

  if (step === 'registration') {
    return <PhoneRegistration onRegistrationComplete={handleRegistrationComplete} />;
  }

  if (step === 'sync') {
    return <ContactSync onSyncComplete={handleSyncComplete} />;
  }

  if (chatUser) {
    return (
      <ChatInterfaceWithHeader 
        contacts={chatUser.contacts} 
        currentUser={{ phone: chatUser.phone, name: chatUser.name }}
      />
    );
  }

  return null;
};

export default Messages;