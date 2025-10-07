import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import ChatInterface from "./ChatInterface";

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
}

interface ChatInterfaceWithHeaderProps {
  contacts: Contact[];
  currentUser: ChatUser;
}

const ChatInterfaceWithHeader = ({ contacts, currentUser }: ChatInterfaceWithHeaderProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Priscilla Chat</h1>
                <p className="text-white/90">Simple. Fast. Free</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface contacts={contacts} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default ChatInterfaceWithHeader;